/**
 * Created by bvfergus on 3/5/16.
 */
const express = require("express")
const request = require("request")
const mongoose = require("mongoose")
const nodemailer = require('nodemailer')
const mandrillTransport = require('nodemailer-mandrill-transport')
const bcrypt = require("bcryptjs")
const Q = require("q")
const _ = require("underscore")
const queryString = require("querystring")
const config = require("config")
const mandrillConfig = config.get("Mandrill")

let User = require("./../models/User")
let Project = require("./../models/Project")
let ArchivedUser = require("./../models/ArchivedUser")
let LoginController = require("./../middleware/LoginController")
let middleware = require("./../middleware/Middleware")
let MountModelToRouter = require("./MountModelToRouter")

let router = express.Router()

MountModelToRouter(router, User, "user", { create:false, delete: false, read: false, list: false })

router.post("/", function(req, res){

    var userData = req.body.user

    var model = User(userData)

    model.save((error, result)=>{
        if (error){
            if (error.name === "ValidationError") {
                var errors = {}

                for (var property in error.errors) {
                    if (error.errors[property].kind === "user defined") {
                        errors[property] = error.errors[property].properties.kind
                    } else {
                        errors[property] = error.errors[property].kind
                    }
                }

                res.status(406).send({ validationErrors: errors })
                return
            } else if (error.code === 11000) {
                res.status(409).send()
                return
            } else {
                console.error(error)
                res.status(500).send()
                return
            }
        } else {
            res.status(201).json(LoginController.generateLoginObjectForUser(result))
        }
    })

})

router.put("/", function(req, res){
    let userData = req.body.user
    let id = req.user._id

    if (!userData) {
        res.status(400).send()
        return
    }
    
    // New object for acceptable updatable attribute
    updatedUser = _.pick(userData, 'fullname', 'email', 'prefs', 'media')
    console.log(updatedUser)

    Q(User.findOneAndUpdate( { '_id' : id }, updatedUser, {
        new: true, runValidators: true, setDefaultsOnInsert: false
    }).exec())
    .then((user) => {
        // send 404 if the user doesn't exist
        if (!user) {
            res.status(400).send()
            return
        } else {
            res.status(200).send({ user: user.toPublic() })
        }
    })
    .catch((error) => {
        if (error.name === "ValidationError") {
                var errors = {}

                for (var property in error.errors) {
                    if (error.errors[property].kind === "user defined") {
                        errors[property] = error.errors[property].properties.kind
                    } else {
                        errors[property] = error.errors[property].kind
                    }
                }

                res.status(406).send({ validationErrors: errors })
        } else if (error.code === 11000) {
            res.status(409).send()
        } else {
            console.error(error)
            res.status(500).send()
        }
    })
})

router.get("/:id", middleware.authRequired,function(req, res) {
    let user = req.user
    let _id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(_id)) { return res.status(400).send() }

    if (user._id != _id) { return res.status(401).send() }

    return res.status(200).send({ user: user.toPublic() })
})

router.delete("/:id", function(req, res) {
    var id = req.params.id
    var user = req.user

    if (!user || id != user._id) {
        res.status(400).send()
        return
    }

    Q(User.findById(user._id).exec())
        .then((dbUser) => {
            if (!dbUser) {
                res.status(400).send()
                return
            }

            if (dbUser.accountArchiveToken && dbUser.accountArchiveToken > Date.now()) {

                // good to go, we can archive the account
                var archiveUser = ArchivedUser({
                    user_id: user._id,
                    username: user.username,
                    email: user.email,
                    fullname: user.fullname
                })

                archiveUser.save((err) => {
                    if (err) {
                        throw new Error(err)
                    }
                    dbUser.remove((err, doc) => {
                        if (err) { console.error(err) }
                        res.status(204).send()
                    })
                })
            } else {
                res.status(400).send()
            }
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send()
        })
})

router.post("/convert/:temp_id", function(req, res) {
    let user = req.user

    
})

router.post("/login", function(req, res){
    var user = req.body.user

    if (!user || !user.username || !user.password) {
        res.status(400).send()
        return
    }

    LoginController.login(user)
        .then(function(result){
            res.json(result)
        }).fail(function(err){
            res.status(401).send()
        })

})

router.post("/reset_password", function(req, res) {
    var user = req.user
    var oldPassword = req.body.resetObject.oldPassword
    var newPassword = req.body.resetObject.newPassword
    var token = req.body.resetObject.token

    if ((!oldPassword && !newPassword) || (!newPassword && token)) {
        res.status(400).send()
    }

    if (oldPassword && newPassword) {
        bcrypt.compare(oldPassword, user.password, function(error, result) {
            if (error) {
                res.status(500).send()
                return
            } else if (!result) {
                res.status(400).send()
                return
            } else {
                Q(User.findById(user._id).exec())
                    .then((userRes) => {
                        userRes.password = newPassword
                        userRes.save()
                        res.json(LoginController.generateLoginObjectForUser(userRes))
                    })
                    .catch((error) => {
                        console.error(error)
                        res.status(500).send()
                    })
            }

            
        })
        return
    } else if (token && newPassword) {
        //passively validates token and date
        Q(User.findOne({
            resetPasswordToken:token,
            resetPasswordExpires: { $gte: Date.now() }
        })
            .exec())
            .then(function(user) {
                if (!user) {
                    throw new Error("No user found")
                }

                user.password = newPassword
                user.save()
                res.json(LoginController.generateLoginObjectForUser(user))
            }).catch(function(e) {
                console.error(e)
                res.status(500).send()
            })
        return
    } else {
        res.status(400).send()
    }
    
})

router.post("/recover_password", function(req, res) {
    var username = req.body.username

    if (username && username.length > 0) {

        Q(User.findOne({"username":username}).exec())
        .then(function(user) {
            //send back OK response even if the user is not found
            if (!user) {
                var e = new Error("No user found")
                e.status = 204
                throw e
            } else {
                return new Promise(function(resolve, reject) {
                    bcrypt.hash(String(user._id) + Date.now().toString(), 8, function(err, hash) {
                        if (err) {
                            reject(err)
                        } else {
                            user.resetPasswordToken = hash
                            user.resetPasswordExpires = Date.now() + 3600000
                            resolve(user)
                        }
                    })
                })
            }
        }).then(function(user) {

            user.save(function(err) {
                if (err) { throw new Error(err) }
            })

            //TODO automatically set prod/test keys
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    apiKey: mandrillConfig.apiKey
                }
            }))

            var query = queryString.stringify({
                token: user.resetPasswordToken
            })
            
            //TODO set link to Angular component URL
            transport.sendMail({
                from: 'Edji <recovery@edji.it>',
                to: user.email,
                subject: 'Password Recovery - Edji',
                html: `
                    <p>Hello ${user.fullname},</p>
                    <p>You (or someone else) requested a password reset on your Edji account. Please click the link to <a href="http://${mandrillConfig.host}/#/reset-password?${query}">reset your password</a></p>
                    <hr>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <br>
                    <p>Keep reading!</p>
                    <p>The <strong>Edji</strong> Team</p>
                `
            }, function(err, info) {
                if (err) {
                    throw new Error(err)
                } else {
                    // console.log(info)
                }
            })
            res.status(204).send()
        }).catch(function(e) {

            // e.status will be 204 if no user is found so that we don't tell people the user exists
            var status
            if (e.status && e.status === 204) {
                status = e.status
            } else {
                console.error(e)
                status = 500
            }
            // var status = e.status || 500
            res.status(status).send()
        })
    }
})

/** Used to validate credentials with a user that is already logged in and set accountArchiveToken */
router.post("/verify", function(req, res) {
    var submittedPassword = req.body.password // should have password and username properties
    var user = req.user

    if (!user) {
        req.status(400).send()
        return
    }

    // construct a new user to make sure we're not messing with any mongo objects
    var trialUser = {
        username: user.username,
        password: submittedPassword
    }

    // try to log that user in
    LoginController.login(trialUser).then((userObject) => {

        if (!userObject.user) {
            // this should never happen anyway
            res.status(400).send()
            return
        }

        Q(User.findById(userObject.user._id).exec())
            .then((dbUser) => {
                if (!dbUser) {
                    res.status(400).send()
                }

                //by this point, we pretty much think the user is the real deal set that user's token and send back the thumbs up
                dbUser.accountArchiveToken = Date.now() + 300000
                dbUser.save((err) => {
                    if (err) { throw new Error(err) }
                    res.status(204).send()
                })
            })
    })
    .catch((error) => {
        console.log(error)
        res.status(500).send()
    })
})

module.exports = router