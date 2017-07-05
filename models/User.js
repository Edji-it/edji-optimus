/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")
var bcrypt = require("bcryptjs")
var Filter = require("bad-words"),
    filter = new Filter()

// tests email against regex
var emailRe = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
var validateEmail = function(email) {
    return emailRe.test(email)
}

// var nameRe = /(?:([^a-zA-Z0-9\s]))/g
var validateName = function(name) {
    return filter.clean(name) === name
}

function toLower(str) {
    return str.toLowerCase()
}

function noWhitespace(username) {
    var regexp = /^\S*$/ // a string consisting only of non-whitespaces
    return regexp.test(username)
}

function hasValidLogin(username) {
    // make sure it has a password or an oauth type
    return this.password || (this.oauth && this.oauth.type)
}

var usernameValidator = [
    { validator: validateName, message: "Invalid username", kind: "badWords" },
    { validator: noWhitespace, message: "Invalid username", kind: "whitespace" },
    { validator: hasValidLogin, message: "User must have password or oauth type", kind: "auth" }
]

let oauthEnum = {
    values: ['google'],
    message: 'oauth type invalid'
}

var model = ModelCreator("User", {
    username:{type:String, set:toLower, unique:true, required:true, validate: usernameValidator},
    fullname:{type:String, required:true, validate: {validator: validateName, message: "Invalid name", kind: "badWords"}},
    password:{type:String},
    oauth: {
        type: { type: String, enum: oauthEnum }
    },
    email:{type:String, set:toLower, unique:true, required:true, validate: {validator: validateEmail, message: "Invalid email", kind:"emailRegex"}},
    identities: [String],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    accountArchiveToken: Date,
    avatar : String,
    prefs: {
        recentEmoji: [ String ],
        onboarding: {
            highlighting: {
                firstDone: Date,
                lastDone: Date
            },
            newReading: {
                firstDone: Date,
                lastDone: Date
            },
            createReadingFromDash: {
                firstDone: Date,
                lastDone: Date
            }
        }
    },
    media: {
        images: [ {
            title: String,
            url:  String
        } ],
        documents: [
            {
                title: String,
                pages: [ String ]
            }
        ]
    }
    
}, function(schema) {
    schema.methods.toPublic = function() {
        //makes copy of document
        var user = {}
        Object.assign(user, this._doc)

        //deletes properties which should not be passed to front end
        delete user.password
        delete user.resetPasswordToken
        delete user.resetPasswordExpires
        delete user.accountArchiveToken
        return user
    }
})

model.schema.pre("save", function(next){
    
    if (this._id && !this.isModified("password")){
        next()
    }

    bcrypt.hash(this.password, 10, (error, hash)=>{
        if (error) {
            console.log(error)
        }

        this.password = hash
        next()
    })

})

module.exports = model
