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

var usernameValidator = [
    { validator: validateName, message: "Invalid username", kind: "badWords" },
    { validator: noWhitespace, message: "Invalid username", kind: "whitespace" }
]

/** mongoose hook for validation against acceptable values for `types` */
var heroStatuses = {
    values: ['subscribed', 'unsubscribed', 'canceled'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

var subscriptionType = {
    values: ['monthly', 'yearly', 'academy', 'none'],
    message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

var model = ModelCreator("User", {
    username:{type:String, set:toLower, unique:true, required:true, validate: usernameValidator},
    fullname:{type:String, required:true, validate: {validator: validateName, message: "Invalid name", kind: "badWords"}},
    password:{type:String, required:true},
    email:{type:String, set:toLower, unique:true, required:true, validate: {validator: validateEmail, message: "Invalid email", kind:"emailRegex"}},
    identities: [String],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    accountArchiveToken: Date,
    avatar : String,
    hero : {
        /**
         * Subscription status
         * Do not save to database, dynamically provided
         */
        active: { type: Boolean }, 
        /**
         * Will Expire
         * - Date when user's Hero subscription will expire
         */
        will_expire: { type: Date },
        /**
         * Type
         * - 'monthly'  Monthly subscriber
         * - 'yearly'   Yearly subscriber
         * - 'academy'  Part of an institution subsribed as an Academy 
         */
        type: { type: String, enum: subscriptionType, default: 'none'},
        /**
         * Active Subscription Id
         */
        subscription_id: { type: String },
        subscription_name: String,
        /**
         * Updates to user's hero status, as a papertrail
         * - Eg.: {  change: 'subscribed', date: '2017-06-16T01:36:37.128Z', subscriptionId: 'sub_AzLTHxKqE8orQq' }
         */
        history: [{
            /**
             * Change: use applicable Status value (subscribed, canceled, unsubscribed)
             */
            change: { type: String, enum: heroStatuses, default: "unsubscribed" },
            date: Date,
            type: { type: String, enum: subscriptionType, default: 'none'},
            /**
             * Stripe Subscription ID
             * https://stripe.com/docs/api#subscription_object
             */
            subscription_id: String
        }],
        /**
         * Stripe Customer Id
         */
        customer_id: { type: String }
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

        console.log('hero active', user.hero.active)

        //deletes properties which should not be passed to front end
        delete user.password
        delete user.resetPasswordToken
        delete user.resetPasswordExpires
        delete user.accountArchiveToken
        delete user.hero.customer_id
        return user
    }
})

model.schema.pre("save", function(next){

    // We should not save dynamically added properties
    this.hero && delete this.hero.active
    
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
