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
var bcrypt = require("bcryptjs");
var Q = require("q");

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
    var oldPassword = req.body.resetObject.oldPassword;
    var newPassword = req.body.resetObject.newPassword;
    var token = req.body.resetObject.token;

    if (oldPassword && newPassword) {
        bcrypt.compare(oldPassword, user.password, function(error, result) {
            if (result) {
                user.oldPassword = newPassword;
                user.save();
                res.json(user.toPublic());
            } else {
                console.log("error: " + error);
                res.status(500).send();
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
            res.json(user.toPublic());
        }).catch(function(e) {
            console.log(e);
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
        console.log(username);

        Q(User.findOne({"username":username}).exec())
        .then(function(user) {
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
        }).then(function(user) {
            user.save(function(err) {
                if (err) { throw new Error(err); }
            });

            //TODO automatically set prod/test keys
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    // apiKey: 'wSJ57j95VAnZrzXQep81NQ' //prod key
                    apiKey: 'wMtMJaiBpAHZ8-PsPIxY2A' //test key
                }
            }));
            
            //TODO set link to Angular component URL
            transport.sendMail({
                from: 'recovery@edji.it',
                to: user.email,
                subject: 'Password Recovery - Edji',
                html: `
                    <p>Hello ${user.fullname},</p>
                    <p>You (or someone else) requested a password reset on your Edji account. Please click the link to <a href="http://${req.headers.host}/users/recover_password/${encodeURIComponent(user.resetPasswordToken)}">reset your password</a></p>
                    <hr>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <hr>
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
            console.log(e);
            res.status(500).send();
        });
    }
});

router.get("/recover_password/:token", function(req, res) {
    var token = decodeURI(req.params.token);

    Q(User.findOne({
        resetPasswordToken:token,
        resetPasswordExpires: { $gt: Date.now() }
    }).exec())
    .then(function(user) {
        if (!user) {
            throw new Error("No user found");
        }

        res.status(204).send();
    }).catch(function(e) {
        console.log(e);
        res.status(500).send();
    });
});

module.exports = router;