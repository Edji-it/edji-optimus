/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator");
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var Filter = require("bad-words"),
    filter = new Filter();

// tests email against regex
var emailRe = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
var validateEmail = function(email) {
    return emailRe.test(email);
};

var nameRe = /(?:([^a-zA-Z0-9\s]))/g;
var validateName = function(name) {
    // if nameRe.test(name) === true, validation fails.
    // if filter.clean(name) === name, validation should not fail
    return !nameRe.test(name) && filter.clean(name) === name;
};

function toLower(str) {
    return str.toLowerCase();
}

var model = ModelCreator("User", {
    username:{type:String, set:toLower, unique:true, required:true, validate: [validateName, "Invalid username"]},
    fullname:{type:String, required:true, validate: [validateName, "Invalid name"]},
    password:{type:String, required:true},
    email:{type:String, set:toLower, unique:true, required:true, validate: [validateEmail, "Invalid email"]},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isTeacher:Boolean
}, function(schema) {
    schema.methods.toPublicJSON = function() {
        //makes copy of document
        var user = {};
        Object.assign(user, this._doc);

        //sets properties which should not be passed to front end to null
        delete user.password;
        delete user.resetPasswordToken;
        delete user.resetPasswordExpires;
        return user;
    };
});

model.schema.pre("save", function(next){

    if (this._id && !this.isModified("password")){
        next();
    }

    bcrypt.hash(this.password, 10, (error, hash)=>{
       this.password = hash;
       console.log(error);
        next();
    });

});

module.exports = model;
