const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");

// View Engine Setup 
app.set("views",path.join(__dirname,"views")) 
app.set("view engine","ejs") 

//used to specify file destination on local system after uploading
let storage = multer.diskStorage({
    destination: "uploads",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + ".jpg")
    }
})

const maxSize = 1 * 1000 * 1000; //1 mb
    
var upload = multer({  
    storage: storage, 
    limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
    
        // Set the filetypes, it is optional 
        var filetypes = /jpeg|jpg|png|txt/; 
        var mimetype = filetypes.test(file.mimetype); 
  
        var extname = filetypes.test(path.extname( 
                    file.originalname).toLowerCase()); 
        
        if (mimetype && extname) { 
            return cb(null, true); 
        } 
      
        cb("Error: File upload only supports the "
                + "following filetypes - " + filetypes); 
      }  
  
// myFile is the name of file attribute 
}).single("myFile");        
  
app.get("/",function(req,res){ 
    res.sendFile(__dirname + "/index.html");
}) 
    
app.post("/uploadProfilePicture",function (req, res) { 
        
    // Error MiddleWare for multer file upload, so if any 
    // error occurs, the image would not be uploaded! 
    upload(req,res,function(err) { 
  
        if(err) { 
  
            // ERROR occured (here it can be occured due 
            // to uploading image of size greater than 
            // 1MB or uploading different file type) 
            res.send(err) 
        } 
        else { 
  
            // SUCCESS, image successfully uploaded 
            res.send("Success, Image uploaded!") 
        } 
    }) 
}) 
    
// Take any port number of your choice which 
// is not taken by any other process 
app.listen(3000,function(error) { 
    if(error) throw error 
        console.log("Server created Successfully on PORT 3000") 

}) 


