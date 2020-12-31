const express = require("express");
const app = express();
const path = require("path")
const multer = require("multer");
const body = require("body-parser");
const randtoken = require("rand-token");
const fs = require("fs");

app.use(express.static("public"));
app.use(body.urlencoded({ extended: true }));

let token = "";

//used to specify file destination on local system after uploading
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Generate a 16 character alpha-numeric token
        token = randtoken.generate(16);
        console.log(token);
        // if (!fs.existsSync('./uploads/' + token)){
        //     fs.mkdirSync('/uploads/' + token);
        // }
        cb(null, '/uploads')
    },

    filename: function (req, file, cb) {

        cb(null, file.originalname);

    }
})
//upload can process one file each time
let upload = multer({
    storage: storage //this specify file name and destination after uploading
    // myFile is the name of file attribute 
}).single("myFile");

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/main.html");
})

app.post("/uploadFileAndGetFileUrl", (req, res) => {

    upload(req, res, function (err) {

        if (err) {
            console.log("error");
            res.send(err)
        }
        else {
            // SUCCESS, file successfully uploaded 
            res.send("http://127.0.0.1:3000/DownloadFileWithRandomUrl/" + token);
        }
    })
    //generate a random url
    //then call upload, make connection between the url and the submitted file
})

app.get('/downloadFileWithRandomUrl/:token', (req, res) => {

    // Retrieve the tag from our URL path
    let token = req.params.token;
    //use fs module
    const folder = './uploads/' + token;
    let fileName = '';
    fs.readdir(folder, (err, files) => {
        //fileName is the first file(only one) under the folder
        fileName = files[0];
    });

    let dir = path.join(__dirname, 'uploads/' + fileName);
    console.log(dir);
    res.download(dir, fileName, function (error) {
        console.log("Error: ", error);
    });
    console.log("downloaded");
    //res.sendFile();
})

//sign in page
app.get('/signin', function (req, res) {
    res.sendFile(__dirname + "/signin.html");
    console.log("get signin")
})

//after successfully signing in, go to main page
app.post('/signin', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    console.log(email, password);
    res.redirect('/');
})

// Take any port number of your choice which 
// is not taken by any other process 
app.listen(3000, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 3000")

})


