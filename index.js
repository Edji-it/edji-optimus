/**
 * Created by bvfergus on 3/5/16.
 */
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var User = require("./models/User");
var bcrypt = require("bcrypt");
var LoginController = require("./LoginController");

console.log("test");
//routers
var users = require("./routes/users");
var readings = require("./routes/readings");
var comments = require("./routes/comments");

var app = express();

app.use(bodyParser());
app.use(LoginController.middleware);

// Access allowed for development
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use("/users",users);
app.use("/readings",readings);
app.use("/comments", comments);
app.post("/login", function(req, res){

    var user = req.body.user;

    User.findOne({username:user.username}, function(err, dbUser){

        bcrypt.compare(user.password, dbUser.password, function(error, result){
            if (result){
                var token = LoginController.generateTokenForUser(dbUser);
                res.json({user:dbUser, token });
            }
            else{
                res.status("400");
                res.json({error:"Wrong Credentials"});
            }
        })

    });
});

app.get("/user", function(req, res){

    req.user && res.send(req.user);

    !req.user && res.status(400) && res.send({error:"Not Logged In"});
});

var port = process.env.PORT || 3354;

app.listen(port);
