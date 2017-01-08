/**
 * Created by bvfergus on 3/5/16.
 */
var express = require( "express");
var request = require("request");
var bcrypt = require("bcryptjs");
var MountModelToRouter = require("./MountModelToRouter");
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
var bcrypt = require("bcryptjs");
var Q = require("q");
var queryString = require("querystring");
var config = require("config");
var mandrillConfig = config.get("Mandrill");

var User = require("./../models/User");
var LoginController = require("./../LoginController");

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
            if (error.name === "ValidationError") {
                res.status(406).send();
                return;
            } else if (error.code === 11000) {
                res.status(409).send();
                return;
            } else {
                console.error(error);
                res.status(500).send(JSON.stringify(error));
                return;
            }
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
            res.status(400);
            res.json({error:err});
        });

});

router.post("/reset_password", function(req, res) {
    var user = req.user;
    var oldPassword = req.body.resetObject.oldPassword;
    var newPassword = req.body.resetObject.newPassword;
    var token = req.body.resetObject.token;

    if (oldPassword && newPassword) {
        bcrypt.compare(oldPassword, user.password, function(error, result) {
            if (error) {
                res.status(500).send();
                return;
            } else if (!result) {
                res.status(400).send();
                return;
            } else {
                Q(User.findById(user._id).exec())
                    .then((userRes) => {
                        userRes.password = newPassword;
                        userRes.save();
                        res.json(LoginController.generateLoginObjectForUser(userRes));
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send();
                    });
            }

            
        });
        return;
    } else if (token && newPassword) {
        //passively validates token and date
        Q(User.findOne({
            resetPasswordToken:token,
            resetPasswordExpires: { $gte: Date.now() }
        })
            .exec())
            .then(function(user) {
                if (!user) {
                    throw new Error("No user found");
                }

                user.password = newPassword;
                user.save();
                res.json(LoginController.generateLoginObjectForUser(user));
            }).catch(function(e) {
                console.error(e);
                res.status(500).send();
            });
        return;
    } else {
        res.status(400).send();
    }
    
});

router.post("/recover_password", function(req, res) {
    var username = req.body.username;

    if (username && username.length > 0) {

        Q(User.findOne({"username":username}).exec())
        .then(function(user) {
            //send back OK response even if the user is not found
            if (!user) {
                var e = new Error("No user found");
                e.status = 204;
                throw e;
            } else {
                return new Promise(function(resolve, reject) {
                    bcrypt.hash(String(user._id) + Date.now().toString(), 8, function(err, hash) {
                        if (err) {
                            reject(err);
                        } else {
                            user.resetPasswordToken = hash;
                            user.resetPasswordExpires = Date.now() + 3600000;
                            resolve(user);
                        }
                    });
                });
            }
        }).then(function(user) {

            user.save(function(err) {
                if (err) { throw new Error(err); }
            });

            //TODO automatically set prod/test keys
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    apiKey: mandrillConfig.apiKey
                }
            }));

            var query = queryString.stringify({
                token: user.resetPasswordToken
            });
            
            //TODO set link to Angular component URL
            transport.sendMail({
                from: 'recovery@edji.it',
                to: user.email,
                subject: 'Password Recovery - Edji',
                html: `
                    <p>Hello ${user.fullname},</p>
                    <p>You (or someone else) requested a password reset on your Edji account. Please click the link to <a href="http://${mandrillConfig.host}/#/newPassword?${query}">reset your password</a></p>
                    <hr>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <br>
                    <p>Keep reading!</p>
                    <p>The <strong>Edji</strong> Team</p>
                `
            }, function(err, info) {
                if (err) {
                    throw new Error(err);
                } else {
                    // console.log(info);
                }
            });
            res.status(204).send();
        }).catch(function(e) {

            // e.status will be 204 if no user is found so that we don't tell people the user exists
            var status;
            if (e.status && e.status === 204) {
                status = e.status;
            } else {
                console.error(e);
                status = 500;
            }
            // var status = e.status || 500;
            res.status(status).send();
        });
    }
});

module.exports = router;