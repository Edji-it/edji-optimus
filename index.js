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

var app = express();

app.use(bodyParser());
app.use(LoginController.middleware);
app.use("/users",users);
app.use("/readings",readings);

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
