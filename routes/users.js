/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var User = require("./../models/User");
var LoginController = require("./../LoginController");
var bcrypt = require("bcryptjs");
var MountModelToRouter = require("./MountModelToRouter");
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

var router = express.Router();

MountModelToRouter(router, User, "user", {create:false});

router.post("/", function(req, res){

    if (!req.body["user"]) {
        res.status(400).send();
        return;
    }

    var userData = req.body.user;

    var model = User(userData);

    model.save((error, result)=>{
        if (error){
            console.log(error);
            res.json(error);
            return;
        }
        res.json(LoginController.generateLoginObjectForUser(result));
    });

});

router.post("/login", function(req, res){
    var user = req.body.user;

    LoginController.login(user)
        .then(function(result){
            res.json(result);
        }).fail(function(err){
            res.status("400");
            res.json({error:err});
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

router.post("/recover_password", function(req, res) {
    var username = req.body.username;

    if (username && username.length > 0) {
        console.log(username);

        User.findOne({"username":username})
            .then(function(user) {
                console.log(user.email);

                var transport = nodemailer.createTransport(mandrillTransport({
                    auth: {
                        apiKey: 'wSJ57j95VAnZrzXQep81NQ' //prod key
                        // apiKey: 'wMtMJaiBpAHZ8-PsPIxY2A' //test key
                    }
                }));
                
                transport.sendMail({
                    from: 'recovery@edji.it',
                    to: user.email,
                    subject: 'Password Recovery - Edji',
                    html: `
                        <p>Hello ${user.fullname},</p>
                        <p>A password reset was requested on your Edji account. To reset your passsword, please click the link: <a href="#"></a></p>
                        <hr>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <hr>
                        <p>Keep reading!</p>
                        <p>The <strong>Edji</strong> Team</p>
                    `
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(info);
                    }
                });

                res.status(204).send();
            }).catch(function(err) {
                console.log(err);
                res.status(500).send();
            });
    }



});

module.exports = router;