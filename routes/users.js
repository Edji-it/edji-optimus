/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var User = require("./../models/User");
var LoginController = require("./../LoginController");
var bcrypt = require("bcryptjs");
var MountModelToRouter = require("./MountModelToRouter");

var router = express.Router();

MountModelToRouter(router, User, "user", {create:false});

router.post("/", function(req, res){

    if (!req.body["user"]) {
        //send error
        return;
    }

    var userData = req.body.user;
    console.log(userData);

    var model = User(userData);
    console.log("model id: " + model._id);

    model.save((error, result)=>{
        if (error){
            console.log(error);
            res.json(error);
            return;
        }
        res.json(LoginController.generateLoginObjectForUser(result));
    });

});

router.post("/reset_password", function(req, res) {
    var user = req.user;
    var password = req.body.password;
    var newPassword = req.body.newPassword;
    console.log("user: " + user);

    console.log(password);
    console.log(newPassword);
    console.log(user.password);

    bcrypt.compare(password, user.password, function(error, result) {
        console.log("result: " + result);
        if (result) {
            console.log(result);
            user.password = newPassword;
            user.save();
            res.json(result);
        } else {
            console.log("error: " + error);
            res.status(400).send();
        }
    });

});

module.exports = router;