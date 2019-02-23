/**
 * Created by bvfergus on 3/5/16.
 */
const express = require("express")
const mongoose = require("mongoose")
const nodemailer = require('nodemailer')
const mandrillTransport = require('nodemailer-mandrill-transport')
const bcrypt = require("bcryptjs")
const Q = require("q")
const _ = require("underscore")

const User = require("./../models/User")
const ArchivedUser = require("./../models/ArchivedUser")
const LoginController = require("./../middleware/LoginController")
const authRequired = require('./../middleware/auth-required')
const Referral = require('./../models/Referral')
const cleanMongoValidationError = require('./../error-handlers/mongo-validation').cleanMongoValidationError

const router = express.Router()

router.post("/", async function (req, res, next) {

    let userData = req.body.user

    try {
        let user = await User(userData).edjiSave()
        // update the referring user's Referral object to reflect their referral
        if (user.referred_by) {
            await Referral.findOneAndUpdate(
                { code: user.referred_by },
                {
                    $push: {
                        users_referred: {
                            user_id: user._id,
                            status: 'registered'
                        }
                    }
                }
            )
        }

        return res.status(201).send(LoginController.generateLoginObjectForUser(user))
    } catch (error) {
        // constructs object with list of model-defined errors to send to user
        if (error.name === "ValidationError") {
            let validationErrors = cleanMongoValidationError(error)
            return res.status(406).send({ validationErrors })
        } else if (error.code === 11000) {
            return res.status(409).send()
        } else {
            return next(error)
        }
    }
})

let duplicateFieldErrorHandler = function (error) {
    // this is going to be a little hacky
    // we need to have all the possible duplicate indexes handled manually, unfortunately, since it doesn't give us the index
    let path
    if (error.message.indexOf('username') > -1) {
        path = 'username'
    } else if (error.message.indexOf('email') > -1) {
        path = 'email'
    }

    let message
    if (path) {
        message = 'duplicate key error for field: ' + path
    } else {
        message = 'error in determining duplicate path'
        throw new Error('a duplicate error was returned, but it could not be identified.')
    }

    return {
        duplicateFieldError: {
            message: message,
            field: path
        }
    }
}

router.put("/", authRequired, async function (req, res, next) {
    let userData = req.body.user
    let user = req.user

    if (!userData) {
        return res.status(400).send()
    }

    if (userData.referred_by && user.referred_by && user.referred_by != userData.referred_by) {
        return res.status(400).send({ error: "you dumb for tryna update a user's referred_by" })
    }

    const UPDATABLE_PROPERTIES = [
        'fullname',
        'email',
        'prefs',
        'media',
        'avatar',
        'identities',
        'referred_by',
        'school_name',
        'phone_number',
        'sales_can_contact',
        'archive_readings_before'
    ]

    UPDATABLE_PROPERTIES.forEach((property) => {
        if (userData[property]) {
            user[property] = userData[property]
        }
    })

    try {
        let result = await user.edjiSave()
        if (!result)
            return res.status(400).send({ error: 'no result returned from saving user' })
        else
            return res.status(201).json(LoginController.generateLoginObjectForUser(result))
    } catch (error) {
        // constructs object with list of model-defined errors to send to user
        if (error.name === "ValidationError") {
            let validationErrors = cleanMongoValidationError(error)
            return res.status(406).send({ validationErrors })
        } else if (error.code === 11000) {
            return res.status(409).send()
        } else {
            return next(error)
        }
    }
})

/**
 * Search route for followers
 */
router.get("/following", authRequired, (req, res, next) => {
    let user = req.user

    let allowedTypes = ['popular']

    let type = req.query.type || 'popular'

    if (allowedTypes.indexOf(type) < 0) {
        return res.status(400).send({
            errors: [{
                parameter: 'type',
                message: 'type does not match any allowed type values',
                value: type
            }]
        })
    }

    User.aggregate([
        { $match: { following: { $exists: true } } },
        { $unwind: "$following" },
        { $group: { _id: "$following", len: { $sum: 1 } } },
        { $sort: { len: -1 } },
        { $limit: 5 }
    ])
        .then((users) => {
            return res.status(200).send({ users: users })
        })
        .catch((err) => {
            next(err)
        })
})

router.get("/:id", authRequired, function (req, res) {
    let user = req.user
    let _id = req.params.id

    if (!mongoose.Types.ObjectId.isValid(_id)) { return res.status(400).send() }

    if (!user._id.equals(_id)) { return res.status(401).send() }

    return res.status(200).send({ user: user.toPublic() })
})

/**
 * Finds a user given a single use token and an oauth type
 * @param {string} token the single use token generated by the passport handler
 * @param {string} type the oauth provider's name
 */
let oauthSingleUseQuery = function (token, type) {
    return User.findOne({
        'oauth.singleUseToken': token,
        'oauth.singleUseTokenExpiration': { $gte: Date.now() },
        'oauth.type': type
    })
}

// this route doesn't currently have tests, which is bad... but I don't know how to test oauth
router.get("/", (req, res, next) => {
    let userQuery
    if (req.query.oauth_type && req.query.oauth_token) {
        userQuery = oauthSingleUseQuery(req.query.oauth_token, req.query.oauth_type)
    } else {
        return res.status(400).send()
    }

    // if the user query has been assigned, execute it
    userQuery.then((user) => {
        if (!user) {
            return res.status(404).send()
        } else {
            return res.status(200).send(LoginController.generateLoginObjectForUser(user))
        }
    })
        .catch((err) => {
            next(err)
        })
})

// nothing is using this so we're just gonna comment it
// router.delete("/:id", async function (req, res, next) {
//     var id = req.params.id
//     var user = req.user

//     if (!user || id != user._id) {
//         return res.status(400).send()
//     }

//     try {
//         let dbUser = await User.findById(user._id)
//         if (!dbUser) {
//             return res.status(400).send()
//         }
//         if (dbUser.accountArchiveToken && dbUser.accountArchiveToken > Date.now()) {
//             // good to go, we can archive the account
//             var archiveUser = ArchivedUser({
//                 user_id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 fullname: user.fullname
//             })

//             archiveUser.edjiSave(false, (err) => {
//                 if (err) {
//                     throw new Error(err)
//                 }
//                 dbUser.remove((err, doc) => {
//                     if (err) { console.error(err) }
//                     return res.status(204).send()
//                 })
//             })
//         } else {
//             return res.status(400).send()
//         }
//     } catch (err) {
//         next(err)
//     }
// })

// front-end call updated 1/24/2019
// this is a replacement for the user conversion route which updates all of the users projects to have their new user's data
router.put("/convert/:temp_id", authRequired, require("./../api/v1/temp_users/convert"))

router.post("/login", async (req, res, next) => {
    var user = req.body.user // note this is coming from the request's body, not the req.user

    if (!user || !user.username || !user.password) {
        return res.status(400).send()
    }

    try {
        let result = await LoginController.login(user)
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return next(err)
        // if (err && err.status) {
        //     return res.status(err.status).send()
        // } else {
        //     return res.status(401).send()
        // }
    }


    // LoginController.login(user)
    //     .then((result) => {
    //         return res.status(200).send(result)
    //     }).catch((err) => {
    //         console.error(err)
    //         if (err && err.status) {
    //             return res.status(err.status).send()
    //         } else {
    //             return res.status(401).send()
    //         }
    //     })
})

router.post("/reset_password", function (req, res, next) {
    var user = req.user
    var oldPassword = req.body.resetObject.oldPassword
    var newPassword = req.body.resetObject.newPassword
    var token = req.body.resetObject.token

    if (!oldPassword || !newPassword) {
        return res.status(400).send({ error: 'oldPassword and newPassword required to reset password' })
    }

    if (!user.password) {
        let error = {
            message: 'no password for user',
            code: 'err_no_password'
        }
        if (user.type === 'temp') error.message += '; user is a temp'
        return res.status(400).send(error)
    }

    bcrypt.compare(oldPassword, user.password, function (err, result) {
        if (err) {
            return next(err)
        }
        if (!result) {
            res.status(400).send()
            return
        }

        User.findById(user._id)
            .then((userRes) => {
                userRes.password = newPassword
                return userRes.edjiSave()
            })
            .then((user) => {
                return res.status(200).send(LoginController.generateLoginObjectForUser(user))
            })
            .catch((err) => {
                next(err)
            })
    })
})

// /** Used to validate credentials with a user that is already logged in and set accountArchiveToken */
// router.post("/verify", async function (req, res, next) {
//     var submittedPassword = req.body.password // should have password and username properties
//     var user = req.user

//     if (!user) {
//         return res.status(400).send()
//     }

//     // construct a new user to make sure we're not messing with any mongo objects
//     var trialUser = {
//         username: user.username,
//         password: submittedPassword
//     }

//     // try to log that user in
//     LoginController.login(trialUser)
//         .then((userObject) => {

//             if (!userObject.user) {
//                 // this should never happen anyway
//                 return res.status(400).send()
//             }

//             User.findById(userObject.user._id)
//                 .then((dbUser) => {
//                     if (!dbUser) {
//                         return res.status(400).send()
//                     }

//                     //by this point, we pretty much think the user is the real deal set that user's token and send back the thumbs up
//                     dbUser.accountArchiveToken = Date.now() + 300000
//                     dbUser.edjiSave(false, (err) => {
//                         if (err) { throw new Error(err) }
//                         res.status(204).send()
//                     })
//                 })
//         })
//         .catch((err) => {
//             next(err)
//         })
// })

// finds the asset of the specified type on the user object
//  if it doesn't find anything, it will return undefined
let getAssetOnUser = function (user, type, id) {
    let assetToDelete = user.media[type].find((asset) => {
        return asset._id == id
    })
    return assetToDelete
}

let getAssetFileLocations = function (asset, type) {
    switch (type) {
        case 'images':
            return [asset.url]
        case 'documents':
            return asset.pages.slice()
        default:
            return
    }
}

router.delete('/assets/:type/:asset_id', authRequired, async (req, res, next) => {
    let user = req.user
    let assetId = req.params.asset_id
    let type = req.params.type
    const allowedTypes = [
        'images',
        'documents'
    ]

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
        return res.status(400).send({ error: "not a valid id" })
    }

    // kick them out if they try to access a type that isn't allowed
    if (allowedTypes.indexOf(type) < 0) {
        return res.status(400).send({ error: "type not allowed" })
    }

    let assetToDelete = getAssetOnUser(user, type, assetId)

    // tell the requester if the object doesn't exist on this user
    if (!assetToDelete) {
        return res.status(404).send()
    }

    let fileLocations = getAssetFileLocations(assetToDelete, type)

    // remove the object from the user's media array
    user.media[type].splice(user.media[type].indexOf(assetToDelete), 1)

    try {
        // make sure to save the user without the asset which will be deleted
        await user.edjiSave()
        return res.status(200).send({ file_locations: fileLocations })
    } catch (err) {
        next(err)
    }
})

/**
 * Adds a user id to a user's "following" array
 */
router.put("/following", authRequired, async function (req, res, next) {
    let user = req.user
    let user_id = req.body.user_id
    let follow = req.body.action == "follow"

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).send({ error: "invalid user_id property" })
    }

    if (user_id == user._id) {
        return res.status(400).send({ error: "you cannot follow yourself" })
    }

    if (!req.body.action) {
        return res.status(400).send({ error: "no action specified" })
    }

    if (!user_id) {
        return res.status(400).send({ error: "no user_id specified" })
    }

    if (!user.following) {
        user.following = []
    }

    let followingMatch = user.following.find((value) => { return value.equals(user_id) })
    if (follow) {
        if (!followingMatch) {
            user.following.push(user_id)
        } else {
            return res.status(400).send({
                error: "requested user is already followed",
                action: req.body.action
            })
        }
    } else {
        if (followingMatch) {
            user.following.splice(user.following.indexOf(followingMatch), 1)
        } else {
            return res.status(400).send({
                error: "requested user was not yet followed",
                action: req.body.action
            })
        }
    }

    try {
        await user.edjiSave()
        return res.status(200).send({ user: result.toPublic() })
    } catch (err) {
        next(err)
    }
})

module.exports = router
