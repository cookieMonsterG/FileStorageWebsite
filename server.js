const express = require("express");
const app = express();
const multer = require("multer");


//used to specify file destination on local system after uploading
let storage = multer.diskStorage({
    destination: "uploads",
   
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
    res.sendFile(__dirname + "/root.html");
})

//go to POST page and start uploading file
app.post("/uploadProfilePicture", function (req, res) {
    
    
    upload(req, res, function (err) {

        if (err) {
            res.send(err)
        }
        else {
            // SUCCESS, image successfully uploaded 
            res.sendFile(__dirname + "/upload.html")
        }
    })
})

// Take any port number of your choice which 
// is not taken by any other process 
app.listen(3000, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 3000")

})


