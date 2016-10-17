/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var User = require("./../models/User");
var bcrypt = require("bcrypt");
var MountModelToRouter = require("./MountModelToRouter");

var router = express.Router();

MountModelToRouter(router, User, "user");

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
            user.save;
            res.status(200).send();
        } else {
            console.log("error: " + error);
            res.status(400).send();
        }
    });

});

module.exports = router;