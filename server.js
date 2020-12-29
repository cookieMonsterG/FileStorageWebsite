const express = require("express");
const app = express();
const path = require("path")
const multer = require("multer");

let number = 0; //used for random url
let fileMap = new Map(); //hold all files and corresponding key

//used to specify file destination on local system after uploading
let storage = multer.diskStorage({
    destination: "uploads",

    filename: function (req, file, cb) {
        number = Math.floor((Math.random() * 1000000) + 1);
        fileMap.set(number.toString(), file);//store file in the map
        let extension = path.extname(file.originalname).toLowerCase();
        cb(null, number.toString() + extension);

    }
})
//upload can process one file each time
let upload = multer({
    storage: storage //this specify file name and destination after uploading
    // myFile is the name of file attribute 
}).single("myFile");

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/root.html");
})

app.post("/uploadFileAndGetFileUrl", (req, res) => {

    upload(req, res, function (err) {

        if (err) {
            console.log("error");
            res.send(err)
        }
        else {
            // SUCCESS, file successfully uploaded 
            res.send("http://127.0.0.1:3000/DownloadFileWithRandomUrl/" + number.toString());
        }
    })
    //generate a random url
    //then call upload, make connection between the url and the submitted file
})

app.get('/downloadFileWithRandomUrl/:token', (req, res) => {

    // Retrieve the tag from our URL path
    let token = req.params.token;

    let currentFile = fileMap.get(token);
    let extension = path.extname(currentFile.originalname).toLowerCase();
    let fileName = token + extension;
    // let fileDir = `${__dirname}\\uploads\\`;
    // console.log(fileDir);
    let dir = path.join(__dirname, 'uploads/' + fileName);
    console.log(dir);
    res.download(dir, fileName, function (error) {
        console.log("Error: ", error);
    });
    console.log("downloaded");
    //res.sendFile();



})

// Take any port number of your choice which 
// is not taken by any other process 
app.listen(3000, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 3000")

})


