// library imports
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const _ = require('underscore')

// project imports
const ModelCreator = require("./ModelCreator")
const helpers = require('./_User')

// tests email against regex
let emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let validateEmail = function (email) {
    return emailRe.test(email)
}

// let nameRe = /(?:([^a-zA-Z0-9\s]))/g
let validateName = function (name) {
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

let OneTimeTokenObject = mongoose.Schema({
    token: { type: String, required: true },
    expiration: { type: String, required: true, default: Date.now() + 1000 /* s */ * 3600 /* h */ * 24 }
})

let model = ModelCreator("User", {
    username: { type: String, set: toLower, unique: true, sparse: true, validate: usernameValidator },
    fullname: { type: String, required: true, validate: { validator: validateName, message: "Invalid name", kind: "badWords" } },
    password: { type: String },
    oauth: [{
        type: { type: String, enum: oauthEnum },
        id: String,
        singleUseToken: String,
        singleUseTokenExpiration: Date
    }],
    email: { type: String, set: toLower, required: true, unique: true, validate: { validator: validateEmail, message: "Invalid email", kind: "emailRegex" } },
    identities: [String],
    referral_code: { type: String, unique: true }, // refers code in Referrals collection
    referred_by: { type: String },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    change_email_token: { type: OneTimeTokenObject },
    last_action_time: Date, // the time the user last hit the server with an Authorization token
    last_message_check_time: { type: Date, default: Date.now() },
    last_refresh_time: { type: Date, default: Date.now() },
    message_list_id: { type: mongoose.Schema.ObjectId, ref: "MessageList" },
    hero_status: Boolean, // whether or not we concluded the user was a hero at the last check
    stripe_customer_id: String, // the user's stripe customer id
    license_ids: [{
        license_id: { type: mongoose.Schema.ObjectId, ref: 'License', required: true },
        joined: { type: Date, required: true }
    }], // the license id for the user's school's license
    avatar: String,
    following: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    prefs: {
        recentEmoji: [String],
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
            },
            firstReadingCreated: {
                firstDone: Date
            }
        }
    },
    media: {
        images: [{
            title: String,
            url: String
        }],
        documents: [
            {
                title: String,
                pages: [String]
            }
        ]
    },
    institution_ids: [{ type: mongoose.Schema.ObjectId, ref: "Institution" }] // array of institution ids which the user is associated with; assumes they are already a teacher if they're being added to an institution
}, function (schema) {
    // add custom method which returns only the properties which we want to be viewable by the client
    schema.methods.toPublic = function () {
        // list out the properties it is ok to return to the front-end
        const clientProperties = [
            '_id',
            'username',
            'fullname',
            'email',
            'identities',
            'last_hero_check',
            'hero_status',
            'referral_code',
            'referred_by',
            'license_ids',
            'institution_ids',
            'stripe_customer_id',
            'avatar',
            'following',
            'prefs',
            'media',
            'createdAt',
            'updatedAt'
        ]

        // return all of the properties in the above array
        return _.pick(this, (value, key, object) => {
            return clientProperties.indexOf(key) > -1
        })
    }

    schema.pre("edjiSave", function (next) {
        if (!this._id) { return next() } // get out of here object without an id (at one point, this was returning the entire node process)

        if (this.password && this.isModified("password")) {
            this.password = bcrypt.hashSync(this.password, 10) // set the new password to a hash of itself
        }

        next()
    })

    // add custom validator to make sure user has either oauth type or username/password
    schema.pre('validate', function (next) {
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

    /**
     * 100% sure that wrapping promises in promises is weird, but I haven't found out how to get the #Model.edjiSave() function to return a promise, so this is what I'm doing for now...
     */
    schema.methods.refresh = function () {
        return new Promise((resolve, reject) => {
            helpers.getUserHeroStatus(this)
                .then((validHero) => {
                    this.hero_status = validHero
                    this.last_refresh_time = Date.now()

                    this.edjiSave(false, (err, result) => {
                        if (err) { reject(err) }
                        else { resolve(result) }
                    })
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    /**
     * Generates and assigns a one time use token based on provided property
     * @param {string} propertyName the property to assign as a one time use token
     * @param {number} expiration the number of hours that the expiration should last
     */
    schema.methods.setOneTimeToken = async function (propertyName, expiration) {
        if (!helpers.isValidTokenProperty(propertyName)) {
            throw new Error('no valid property with that name') // leave function if the property should not be updated this way
        }

        const { unhashedToken, tokenObj } = helpers.createOneTimeTokenObject(expiration)
        this[propertyName] = tokenObj
        await this.edjiSave(false)
        return unhashedToken
    }

    /**
     * Validates and a token stored on the User based on provided property name
     * @param {string} propertyName property name on user object which contains the token to be used
     * @returns {boolean} indicating whether the token was found to be valid or not
     */
    schema.methods.useOneTimeToken = function (propertyName, referToken) {
        if (!helpers.isValidTokenProperty(propertyName) || !this[propertyName]) {
            return false // return false here to indicate the token was not valid or used
        }

        let isValidToken = helpers.validateToken(this[propertyName].token, referToken)

        if (isValidToken) {
            // get rid of the token so we're not storing old tokens on purpose
            this.edjiSave({
                update: {
                    $unset: {
                        [propertyName]: 1
                    }
                }
            }, (err, result) => {
                return isValidToken
            })
        } else {
            return false
        }
    }

    // allow refreshRequired to be accessed like a property on a User object (like user.refreshRequired)
    schema
        .virtual('refresh_required')
        .get(function () {
            if (!this.last_refresh_time) { console.log('no last_refresh_time on ' + this.username) }
            return helpers.refreshRequired(this.last_refresh_time)
        })

    schema
        .virtual('message_check_required')
        .get(function () {
            return helpers.messageCheckRequired(this.last_message_check_time)
        })
})

module.exports = model
