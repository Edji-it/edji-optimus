/**
 * Created by bvfergus on 3/5/16.
 */
var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")
var bcrypt = require("bcryptjs")
var Filter = require("bad-words"),
    filter = new Filter()

// tests email against regex
var emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
var validateEmail = function(email) {
    return emailRe.test(email)
}

function toLower(str) {
    return str.toLowerCase()
}

function noWhitespace(username) {
    var regexp = /^\S*$/ // a string consisting only of non-whitespaces
    return regexp.test(username)
}

let usernameValidator = [
    { validator: noWhitespace, message: "Invalid username", kind: "whitespace" }
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
    username:{type:String, set:toLower, unique:true, sparse: true, validate: usernameValidator},
    fullname:{type:String, required:true},
    password:{type:String},
    oauth: [{
        type: { type: String, enum: oauthEnum },
        id: String,
        singleUseToken: String,
        singleUseTokenExpiration: Date
    }],
    email:{type:String, set:toLower, required:true, validate: {validator: validateEmail, message: "Invalid email", kind:"emailRegex"}},
    identities: [String],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    accountArchiveToken: Date,
    lastActionTime: Date, // the time the user last hit the server with an Authorization token
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
        subscription_type: { type: String, enum: subscriptionType, default: 'none'},
        /**
         * Active Subscription Id
         */
        subscription_id: { type: String },
        subscription_label: String,
        subscription_cost: Number,
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
            subscription_type: { type: String, enum: subscriptionType, default: 'none'},
            /**
             * Stripe Subscription ID
             * https://stripe.com/docs/api#subscription_object
             */
            subscription_id: String
        }],
        /**
         * Stripe Customer Id
         */
        customer_id: String 
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
    // add custom method which returns only the properties which we want to be viewable by the client
    schema.methods.toPublic = function() {
        //makes copy of document
        var user = {}
        Object.assign(user, this._doc)

        //deletes properties which should not be passed to front end
        delete user.password
        delete user.resetPasswordToken
        delete user.resetPasswordExpires
        delete user.accountArchiveToken
        delete user.oauth
        return user
    }
})

model.schema.pre("save", function(next){

    if (!this.password) { return next() } // oauth users won't have a password
    // We should not save dynamically added properties
    this.hero && delete this.hero.active
    
    if (this._id && !this.isModified("password") || !this.password){ return next() }

    bcrypt.hash(this.password, 10, (error, hash)=>{
        if (error) {
            console.error(error)
            next(error)
        }

        this.password = hash
        return next()
    })

})

// add custom validator to make sure user has either oauth type or username/password
model.schema.pre('validate', function(next) {
    // make sure it has a password or an oauth type
    let hasPassword = !!this.password
    let hasUsername = !!this.username
    let hasOauth = !!(this.oauth && this.oauth.length > 0)
    let isValid = (hasPassword && hasUsername) || hasOauth

    if (!isValid) {
        // this is a mongoose method which provides the error to the mongoose error aggrigator
        this.invalidate('auth', 'User must be initalized with credentials (oauth or username/password)', null, 'auth')
    }

    next()
})

module.exports = model
