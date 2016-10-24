/**
 * Created by roverzon on 24/10/2016.
 */
const express = require("express");
const app = express();

const nodegit = require("nodegit");
const path = require("path");
const promisify = require("promisify-node");
const fse = promisify(require("fs-extra"));
const fileName = "newfile.txt";
var formidable = require("formidable");
const repoDir = "./newRepo";

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
var fs = require('fs');


app.use(bodyParser.urlencoded({ extended :  false}));
app.use(express.static(path.join(__dirname , '/bower_components')) );

app.get("/", (req,res) => {
    res.sendFile( path.resolve( __dirname ,  "./views/index.html"));
});


app.post("/api/test", jsonParser, function(req,res){

    console.log(req.query.author);

    return res.send(JSON.stringify(req.body))

});
app.get("/api/files");
app.post("/api/files/upload", (req,res) => {


    // create an incoming form object
    var form = new formidable.IncomingForm();

    // console.log(form)

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        console.log("triggered")
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });

    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);

});


app.put("/api/file/:fileId/update");
app.delete("/api/file/:fileId");


app.post("/api/repo/create",(req,res) => {

    // const author = req.param.author;

    var fileContent = "hello world!";

    fse.ensureDir = promisify(fse.ensureDir);

    var repository;
    var index;

    return fse.ensureDir(path.resolve(__dirname, repoDir))
        .then(function(){
            return nodegit.Repository.init(path.resolve(__dirname, repoDir),0);
        })
        .then(function (repo) {
            repository = repo;
            return fse.writeFile(path.join(repository.workdir(),fileName),fileContent);
        })
        .then(function(){
            return repository.refreshIndex();
        })
        .then(function(idx){
            index = idx;
        })
        .then(function(){
            return index.addByPath(fileName);
        })
        .then(function(){
            return index.write();
        })
        .then(function(){
            return index.writeTree();
        })
        .then(function(oid){

            var author = nodegit.Signature.create("Scout Chacon",
                "schacon@gmail.com",123456789,90);
            var committer = nodegit.Signature.create("Scott A Chacon",
                "scott@github.com", 987654321, 90);

            return repository.createCommit("HEAD", author, committer, "1st commit", oid, []);

        })
        .done(function( commitId ){
            return res.send("New Commit: " + commitId )
        })

});
app.put("/api/repo/update",(req,res) => {

    var fileContent = "hello world!!!!!!!!!!!!!!!!!!!!!!";
    var repo, index, oid;


    return nodegit.Repository.open(path.resolve(__dirname,"./newRepo/.git"))
        .then(function(repoResult){
            repo = repoResult;
            return fse.ensureDir(repo.workdir())
        })
        .then(function(){
            return fse.writeFile(path.join(repo.workdir(),fileName), fileContent);
        })
        .then(function(){
            return repo.refreshIndex();
        })
        .then(function(idx){
            index = idx;
        })
        .then(function(){
            return index.addByPath(fileName);
        })
        .then(function(){
            return index.write();
        })
        .then(function(){
            return index.writeTree();
        })
        .then(function(oidResult){
            oid = oidResult;
            return nodegit.Reference.nameToId(repo,"HEAD");
        })
        .then(function(head){
            return repo.getCommit(head);
        })
        .then(function(parent) {
            var author = nodegit.Signature.create("Scott Chacon",
                "schacon@gmail.com", 123456789, 60);
            var committer = nodegit.Signature.create("Scott A Chacon",
                "scott@github.com", 987654321, 90);

            return repo.createCommit("HEAD", author, committer, "2nd commit", oid, [parent]);
        })
        .done(function(commitId){
            return res.send("New Commit: " + commitId)
        });
});

app.listen(3000,function(){
    console.log("app is listening on port 3000")
});



