const express = require("express");
const mongoose = require("mongoose");
const url = require("url");
const path = require("path");
const fs = require("fs");
// const { dirname } = require("path");
var bodyParser = require('body-parser');  

const app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false })  

app.use(express.static(path.join(__dirname+"/ui")));

app.set('view engine','ejs');

var server = app.listen(8080,() => {
    console.log("Server is running.")
});

const dblink = `mongodb+srv://Ayush:B6pQIEJnN78zl74Z@cluster0.sbck0.mongodb.net/Users?retryWrites=true&w=majority`;

mongoose.connect(dblink).then(() => {
    console.log("Connected to database");
}).catch(err => {
    console.log("Error connecting to database");
})

const userSchema = mongoose.Schema({
    Email:{
        type:String,
        required:true,
        unique:true
    },
    FirstName:{
        type:String,
        required:true
    },
    LastName:{
        type:String,
        required:true
    },
    Password:{
        type:String,
        required:true,
        minLength:8
    },
    UserImage:{
        type:String,
        required:true
    }
})

const userdata = mongoose.model('userdata',userSchema);

let activeUser = new Set();

app.get("/", function(req, res){
    const data = JSON.parse(fs.readFileSync(path.join(__dirname,"ui","/jsonfiles/cities.json")));
    data.user = null;
    console.log(data);
    res.render("index.ejs",{data : data});
});

app.get("/signinpage", function(req, res){
    res.render("signup.ejs");
})

app.post("/signin",urlencodedParser,function(req, res){
    const data = req.body;
    if(checkdata(data)){
        userdata.findOne({email:data.Email,password:data.Password},(err,data) =>{
            if(err){
                console.log("An error occured while signing in.");
                res.send("An error occured while signing in.");
                return;
            }
            if(data == null){
                console.log("User not found.");
                res.send("User not found.");
                return;
            }
            console.log(data);
            if(activeUser.has(data.Email)){
                res.send("User is active from another location.");
                return;
            }
            activeUser.add(data.Email);
            res.render("dashboard.ejs",{data : data});
            return;
        })
    }else{
        res.send("Credentials not valid");
    }
    
})

app.post("/signout",urlencodedParser,function(req, res){
        let data = req.body;
        console.log(data);
        activeUser.delete(data.Email);
        data = {};
        data.user = null;
        res.render("index.ejs",{data : data});
    }
);

app.post("/signupcheck",urlencodedParser,function(req, res){
    const data = req.body;
    console.log(data);
    if(checkdata(data)){
        let user = {
            Email : data.Email,
            FirstName : data.FirstName,
            LastName : data.LastName,
            Password : data.Password,
            UserImage : "/media/User_Profile_images/default.jpg"
        };
        userdata.create(user,(err,info)=>{
            if(err){
                console.log(err);
                console.log("Error creating new user.");
                res.send("Error creating new user.")
                return;
            }
            console.log("New USER created.")
            console.log(info);
            res.render("signup.ejs");
            return;
        });
    }else{
        console.log("Data not valid");
        res.render("Data not valid");
        return;
    }

});

function checkdata(data){
    var pattern=/^[a-zA-z0-9]{2,}[.]{0,1}[a-zA-z0-9]{1,}@[a-z]{2,}[.]{1}[a-z]{2,3}[.]{0,1}[a-z]{0,3}$/;
    if(pattern.test(data.Email)){
        console.log("Email status ok");
    }else{
        console.log("Email not valid");
        return false;
    }

    if(data.FirstName != undefined && data.Firstname == ""){
        console.log("FirstName cannot be empty.")
        return false;
    }

    if(data.LastName != undefined && data.Lastname == ""){
        console.log("Lastname cannot be empty.")
        return false;
    }

    if(data.Password == "" || data.Password.length <= 8){
        console.log("Password not valid.")
        return false;
    }

    return true;
}