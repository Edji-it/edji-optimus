const jwt = require("jsonwebtoken")
const User = require("./../models/User")
const TempUser = require("./../models/TempUser")
const bcrypt = require("bcryptjs")
const Q = require("q")

const Passport = require('./../passport')

//TODO: need something more secret than this
const secret = "fjdskajf;ghert2304tgjf;asjf03qyta'jgh9ndb";
var LoginController = {
    login:function(user){
        var me = this

        return Q.Promise(function(resolve, reject) {
            User.findOne({username: user.username.toLowerCase().trim()}, function (err, dbUser) {
                if (err) {
                    reject(err)
                    return
                } else if(!dbUser) {
                    reject("User does not exist")
                    return
                }

                bcrypt.compare(user.password, dbUser.password, function (error, result) {
                    if (result) {
                        resolve(me.generateLoginObjectForUser(dbUser))
                    }
                    else {
                        reject("Wrong Credentials")
                    }
                })

            })
        })
    },
    generateLoginObjectForUser: function(user){
        user = this.addHeroStatus(user)
        return {
            user: user.toPublic(),
            token: this.generateTokenForUser(user)
        }
    },
    addHeroStatus: function(user) {
        if (!user.hero) {
            user.hero = {}
        }
        // Check if user is expired 
        if (user.hero && user.hero.will_expire && user.hero.will_expire < new Date().getTime()) {
            user.hero.active = false
        } else if (user.hero && user.hero.type != 'none' && user.hero.subscription_id) {
            user.hero.active = true
        } else {
            user.hero.active = false
        }
        return user
    },
    generateTokenForUser: function(user){
        var id
        if (user.type === "temp") {
            id = user.id
            return jwt.sign({id: id, type: user.type}, secret)
        } else if (user.id) {
            id = user.id
            return jwt.sign({id}, secret)
        } else {
            return null
        }
    },
    decodeToken:function(token){
        return jwt.verify(token, secret)
    },
    decodeTokenToUser:function(token, callback){
        var decodedJWT = this.decodeToken(token)
        if (decodedJWT.type === "temp"){
            TempUser.findById(decodedJWT.id, callback)
        } else if (decodedJWT) {
            // set their last action time! Whoo this is so exciting!
            User.findByIdAndUpdate(
                decodedJWT.id,
                { $set: { lastActionTime: Date.now() }},
                { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false },
                callback
            )
        } else {
            callback("Token invalid")
        }
    },
    middleware:function(req, res, next) {
        if (req.headers.authorization){
            LoginController.decodeTokenToUser(req.headers.authorization, function(error, user) {
                if (user){
                    user = LoginController.addHeroStatus(user)
                    req.user = user
                }
                next()
            })
        } else {

            next()
        }
    }
}

module.exports = LoginController
