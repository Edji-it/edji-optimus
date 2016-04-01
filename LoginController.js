/**
 * Created by bvfergus on 3/6/16.
 */

var jwt = require("jsonwebtoken");
var User = require("./models/User");

//TODO: need something more secret than this
var secret = "fjdskajf;ghert2304tgjf;asjf03qyta'jgh9ndb";
var LoginController = {

     generateTokenForUser: function(user){
        var id = user.id;

        return jwt.sign({id}, secret);
    },

     decodeToken:function(token){
        return jwt.verify(token, secret);
     },

     decodeTokenToUser:function(token, callback){
        var obj = this.decodeToken(token);
        if (obj){
            User.findById(obj.id, callback);
        }
        else{
            callback("Token invalid");
        }
    },

     middleware:function(req, res, next){

        if (req.headers.authorization){
            LoginController.decodeTokenToUser(req.headers.authorization, function(error, user){
                if (user){
                    req.user = user;
                }

                next();
            })
        }
         else{
            next()
        }
    }
};

module.exports = LoginController;