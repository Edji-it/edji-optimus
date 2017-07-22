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
    // I'm doing this strange if statement because, for some reason, hasValidLogin is getting called twice and
    //  `this` is different between the two calls. The first time it's the mongoose model, like you'd expect, and the
    //  first part of the call will run. The next time, it looks like it's called with `this` as the entire node process,
    //  which I don't know how to stop so this is just a workaround
    //  So, by checking if there is a fullname, which is required, we make sure that `this` is the Mongoose model
    if (this.fullname) {
        // make sure it has a password or an oauth type
        let hasPassword = !!this.password
        let hasUsername = !!this.username
        let hasOauth = !!(this.oauth && this.oauth.type)
        let isValid = (hasPassword && hasUsername) || hasOauth
        return isValid
    } else {
        return true
    }

}

let usernameValidator = [
    { validator: validateName, message: "Invalid username", kind: "badWords" },
    { validator: noWhitespace, message: "Invalid username", kind: "whitespace" },
    { validator: hasValidLogin, message: "User must have password or oauth type", kind: "auth" }
]

let oauthEnum = {
    values: ['google'],
    message: 'oauth type invalid'
}

/** mongoose hook for validation against acceptable values for `types` */
let heroStatuses = {
    values: ['subscribed', 'unsubscribed', 'canceled'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

let subscriptionType = {
    values: ['monthly', 'yearly', 'academy', 'none'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

let model = ModelCreator("User", {
    username:{type:String, set:toLower, unique:true, validate: usernameValidator},
    fullname:{type:String, required:true, validate: {validator: validateName, message: "Invalid name", kind: "badWords"}},
    password:{type:String},
    oauth: [{
        type: { type: String, enum: oauthEnum },
        id: String
    }],
    email:{type:String, set:toLower, unique:true, required:true, validate: {validator: validateEmail, message: "Invalid email", kind:"emailRegex"}},
    identities: [String],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    accountArchiveToken: Date,
    avatar : String,
    hero : {
        /**
         * Status
         * - 'subscribed'   User is currently a subscribed Hero
         * - 'canceled'     User has stopped paying their subscription
         * - 'unsubscribed' User has never subscribed
         */
        status: { type: String, enum: heroStatuses, default: "unsubscribed" }, 
        /**
         * Updates to user's hero status, as a papertrail
         * - Eg.: {  change: 'subscribed', date: '2017-06-16T01:36:37.128Z', subscriptionId: 'sub_AzLTHxKqE8orQq' }
         */
        updates: [{
            /**
             * Change: use applicable Status value (subscribed, canceled, unsubscribed)
             */
            change: { type: String, enum: heroStatuses, default: "unsubscribed" },
            date: Date,
            /**
             * Stripe Subscription ID
             * https://stripe.com/docs/api#subscription_object
             */
            subscriptionId: String
        }],
        /**
         * Type
         * - 'monthly'  Monthly subscriber
         * - 'yearly'   Yearly subscriber
         * - 'academy'  Part of an institution subsribed as an Academy 
         */
        type: { type: String, enum: subscriptionType, default: 'none'}
    },
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

    if (!this.password) { return next() } // oauth users won't have a password
    
    if (this._id && !this.isModified("password") || !this.password){ return next() }

    bcrypt.hash(this.password, 10, (error, hash)=>{
        if (error) {
            console.log(error)
        }

        this.password = hash
        return next()
    })

})

module.exports = model
