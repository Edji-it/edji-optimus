const jwt = require("jsonwebtoken")
const User = require("./../models/User")
const TempUser = require("./../models/TempUser")
const bcrypt = require("bcryptjs")
const Q = require("q")

const Passport = require('./../passport')

//TODO: need something more secret than this
const secret = process.env.OPTIMUS_PW_SECRET

const LoginController = {
    login: function(user){
        let me = this

        return Q(
            User.findOne({ username: user.username.toLowerCase().trim()})
            .exec()
        )
        .then((dbUser) => {
            return new Promise((resolve, reject) => {
                bcrypt.compare(user.password, dbUser.password, function (error, result) {
                    if (result) {
                        result = me.generateLoginObjectForUser(dbUser)
                        if (result.user && !result.token) {
                            reject({ status: 500 })
                        } else {
                            resolve(result)
                        }
                    } else {
                        console.log('got the wrong credentials')
                        reject({ status: 401 })
                    }
                })
            })
        })
    },
    generateLoginObjectForUser: function(user){
        user = this.addHeroStatus(user)
        let token = this.generateTokenForUser(user)
        
        return {
            user: user.toPublic(),
            token: token
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
        if (user.type === "temp") {
            return jwt.sign({ id: user._id, type: user.type}, secret)
        } else if (user._id) {
            return jwt.sign({ id: user._id }, secret)
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
                { $set: { last_action_time: Date.now() }},
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
