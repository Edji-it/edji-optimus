// library imports
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const _ = require('underscore')

// project imports
const ModelCreator = require("./ModelCreator")
const helpers = require('./_User')
const MessageList = require('./MessageList')

// tests email against regex
let emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let validateEmail = function(email) {
    return emailRe.test(email)
}

// let nameRe = /(?:([^a-zA-Z0-9\s]))/g
let validateName = function(name) {
    // needs to return true for good names
    let listOfWordsItCantContainAtAll = [
        'fuck',
        'cunt',
        'nigger',
        'bitch',
        'bastard',
        'bugger',
        'bloody',
        'penis',
        'vagina',
        'blowjob',
        'pussy',
        'titties',
        'titty',
        'asshole',
        'nipple',
        'damn',
        'dammit',
        'twot',
        'faggot',
        'kike',
        'hymie',
        'canabis',
        'cocaine',
        'heroin',
        'marajuana',
        'opium',
        'xanax'
    ]

    return !listOfWordsItCantContainAtAll.find((word) => {
        return name.indexOf(word) > -1
    })
}

function toLower(str) {
    return str.toLowerCase()
}

function noWhitespace(username) {
    var regexp = /^\S*$/ // a string consisting only of non-whitespaces
    return regexp.test(username)
}

let usernameValidator = [
    { validator: validateName, message: "Invalid username", kind: "badWords" },
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
    fullname:{type:String, required:true, validate: {validator: validateName, message: "Invalid name", kind: "badWords"}},
    password:{type:String},
    oauth: [{
        type: { type: String, enum: oauthEnum },
        id: String,
        singleUseToken: String,
        singleUseTokenExpiration: Date
    }],
    email:{type:String, set:toLower, required:true, unique:true, validate: {validator: validateEmail, message: "Invalid email", kind:"emailRegex"}},
    identities: [String],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    accountArchiveToken: Date,
    last_action_time: Date, // the time the user last hit the server with an Authorization token
    hero_status: Boolean, // whether or not we concluded the user was a hero at the last check
    stripe_customer_id: String, // the user's stripe customer id
    license_ids: [{ type: mongoose.Schema.ObjectId }], // the license id for the user's school's license
    message_list_id: { type: mongoose.Schema.ObjectId, ref: "MessageList" },
    last_message_check: { type: Date, default: Date.now() },
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
    following: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
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
        // list out the properties it is ok to return to the front-end
        const clientProperties = [
            'username',
            'fullname',
            'email',
            'identities',
            'last_hero_check',
            'hero_status',
            'stripe_customer_id',
            'avatar',
            'hero',
            'following',
            'prefs',
            'media'
        ]

        // return all of the properties in the above array
        return _.pick(this._doc, (value, key, object) => {
            return clientProperties.indexOf(key) > -1
        })
    }

    // add a custom method which returns a promise, resolved with whether or not the user is a valid Hero
    schema.methods.checkHeroStatus = function() {
        // helpers.getUserHeroStatus(this._doc)
        // .then((valid) => {
        //     console.log('got the hero status')
        //     // this._doc.
        // })
        // .catch((err) => {
        //     console.error(err)
        // })
        console.log('just checked that users hero status')
        return Promise.resolve(true)
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
