/**
 * Created by bvfergus on 3/6/16.
 */

var jwt = require("jsonwebtoken")
var User = require("./models/User")
var TempUser = require("./models/TempUser")
var bcrypt = require("bcryptjs")
var Q = require("q")
//TODO: need something more secret than this
var secret = "fjdskajf;ghert2304tgjf;asjf03qyta'jgh9ndb";
var LoginController = {

    login:function(user){
        var me = this

        return Q.Promise(function(resolve, reject) {
            User.findOne({username: user.username.toLowerCase()}, function (err, dbUser) {

                if(!dbUser) {
                    reject("User does not exist")
                    return
                }
                if (err) {
                    reject(err)
                    return
                }

                bcrypt.compare(user.password, dbUser.password, function (error, result) {
                    if (result) {
                        resolve(me.generateLoginObjectForUser(dbUser))

                    }
                    else {
                        //res.status("400")
                        reject("Wrong Credentials")
                    }
                })

            })
        })
    }
    ,
    generateLoginObjectForUser(user){
        return {
            user:user.toPublic(),
            token: this.generateTokenForUser(user)
        }
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
        var obj = this.decodeToken(token)
        if (obj.type === "temp"){
            TempUser.findById(obj.id, callback)
        } else if (obj) {
            User.findById(obj.id, callback)
        } else {
            callback("Token invalid")
        }
    },

     middleware:function(req, res, next){
        if (req.headers.authorization){
            LoginController.decodeTokenToUser(req.headers.authorization, function(error, user){
                if (user){
                    req.user = user
                }

                next()
            })
        }
         else{
            next()
        }
    }
}

module.exports = LoginController
