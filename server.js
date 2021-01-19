'use strict';//strict mode
const express = require("express");
const app = express();
const path = require("path")
const multer = require("multer");
const body = require("body-parser");
const randtoken = require("rand-token");
const fs = require("fs");
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler')
const { exec } = require("child_process");

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
// app.use(express.static(__dirname + "/HTML"));
app.use(body.urlencoded({ extended: true }));

//set up database ---------------------------------------------------------------------------------------------
//connect to database "tokenDB"
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    userToken: String
})
//create a new collection "User", all records contains username and password will be saved in the db
const User = mongoose.model('USER', userSchema);

//create second collection to store files' location and its corresponding email account
const fileSchema = new mongoose.Schema({
    email: String,
    fileName: String,
    fileLocation: String,
    token: String
})
const fileCollection = mongoose.model('FILECOLLECTION', fileSchema);
//set up database ---------------------------------------------------------------------------------------------


let token = "";
let currentEmail = ""; // record the current user 
let currentUserToken = ""; // used for authentication

//used to specify file destination on local system after uploading
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Generate a 16 character alpha-numeric token
        token = randtoken.generate(16);
        console.log(token);

        if (!fs.existsSync(__dirname + '/uploads/' + token)) {
            fs.mkdirSync(__dirname + '/uploads/' + token);
        }
        cb(null, __dirname + '/uploads/' + token);
    },

    filename: function (req, file, cb) {

        cb(null, file.originalname);

    },

})

const fileFilter = (req, file, cb) => {

    let found = fileCollection.findOne({ filename: file.filename, email: currentEmail }).exec();
    found.then((record) => {
        if (!record) {
            cb(null, true);
        }
        else {
            return cb(null, false, new Error("duplicate file name"));
        }
    })
}
//upload can process one file each time
let upload = multer({
    storage: storage, //this specify file name and destination after uploading

    //check for duplicate filename before uploading
    fileFilter: fileFilter
    // myFile is the name of file attribute  
});

app.get("/upload", function (req, res) {

    res.render("upload");
})

app.get("/home", function (req, res) {

    fileCollection.find({ email: currentEmail }, function (err, files) {
        if (err) {
            console.log(err);
        } else {

            res.render("home", { files: files });
        }

    })


})

app.post("/uploadFileAndGetFileUrl", asyncHandler(async (req, res) => {

    //upload the file
    let uploadFile = upload.single("myFile");

    //check if the user log in
    if (currentEmail === "") {
        res.send("Please log in first");
    }

    let authenticate = false;
    //authenticate the userToken before uploading
    const user = await User.findOne({ email: currentEmail });
    async function authentication() {
        if (user.userToken === currentUserToken) {
            authenticate = true;
        }
    }

    //if authenticated, start uploading the file
    async function second() {
        if (authenticate) {
            uploadFile(req, res, function (err) {

                console.log(req.file);
                if (err) {
                    console.log("error");
                    res.send(err)
                }
                else {
                    if (typeof req.file === 'undefined') {
                        console.log("duplicate files");
                        //avoid duplicate filename error
                    }
                    else {
                        fileCollection.insertMany({
                            email: currentEmail, fileName: req.file.filename,
                            fileLocation: req.file.destination, token: token
                        },
                            function (err, record) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log(record);
                                }
                            })
                        // SUCCESS, file successfully uploaded 
                    }


                }
            })
        }
        else {
            console.log("userTokens don't match");
        }


    }

    await authentication();
    await second();


    res.render("upload");
}))

app.get('/downloadFileWithRandomUrl/:token', asyncHandler(async (req, res) => {

    let authenticate = false;
    //authenticate the userToken before uploading
    const user = await User.findOne({ email: currentEmail });
    async function authentication() {
        if (user.userToken === currentUserToken) {
            authenticate = true;
        }
    }
    async function second() {
        if (authenticate) {
            // Retrieve the tag from our URL path
            let token = req.params.token;
            //use fs module
            const folder = __dirname + '/uploads/' + token;
            fs.readdir(folder, (err, files) => {
                //fileName is the first file(only one) under the folder
                let fileName = files[0];

                let dir = path.join(__dirname, 'uploads/' + token + '/' + fileName);
                console.log(dir);

                res.download(dir, fileName, function (error) {
                    console.log("Error: ", error);

                });
            });
        }
    }
    await authentication();
    await second();

}))

//sign in page
app.get('/', function (req, res) {
    res.render("signin");
})

/**
 * after successfully signing in, go to main page
 */
app.post('/login', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;


    User.findOne({ email: email }, function (err, user) {
        if (err) {
            console.log("error");
        }
        else {
            if (user === null) {
                console.log("email doesn't exsit!");
                res.render('signin', { user: user });

            } else {
                if (user.password === password) {
                    currentEmail = email; // update current email
                    let userToken = randtoken.generate(20);
                    console.log("success");

                    User.updateOne({ email: email }, { userToken: userToken }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            currentUserToken = userToken;
                            console.log("userToken: " + currentUserToken);
                        }
                    })

                    console.log(currentEmail);
                    res.redirect('/upload');
                }
                else {
                    console.log("Wrong password");
                    res.redirect('/');

                }
            }


        }

    })


})

app.get("/signup", function (req, res) {
    res.render("signup");
})

app.post("/signup", function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    User.findOne({ email: email }, function (error, record) {
        if (error) {
            console.log(error);
        }
        else {
            //if the record doesn't exist, then add it to the database
            if (record === null) {
                User.insertMany([{ email: email, password: password }], function (error, record) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(record);
                    }
                })
                res.redirect("/");
            }
            else {
                console.log("Email exists. Please try again");
                res.redirect("/signup");
            }
        }
    })

})

/**
 * delete a specified file
 */
app.get("/delete/:token", asyncHandler(async function (req, res) {
    let authenticate = false;
    //authenticate the userToken before uploading
    const user = await User.findOne({ email: currentEmail });
    async function authentication() {
        if (user.userToken === currentUserToken) {
            authenticate = true;
        }
    }
    async function second() {
        let token = req.params.token;
        fileCollection.deleteOne({ token: token }, function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/home");
            }
        });
    }

    await authentication();
    await second();


}))

// Take any port number of your choice which 
// is not taken by any other process 
app.listen(3000, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 3000")

})


