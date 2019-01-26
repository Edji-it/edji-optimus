// library imports
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const sentry = require('@sentry/node')

// project imports
const User = require("./../models/User")
const TempUser = require("./../models/TempUser")

// constants
const secret = process.env.OPTIMUS_PW_SECRET

const LoginController = {
    login: async function ({ username, password }) {
        let dbUser = await User.findOne({ username: username.toLowerCase().trim() })
        let match = await bcrypt.compare(password, dbUser.password)
        if (match) {
            let { user, token } = this.generateLoginObjectForUser(dbUser)
            if (!user || !token) {
                throw { status: 401 }
            } else if (user && !token) {
                sentry.captureException(`got user object but not token for id: ${user._id}`)
                throw { status: 500 }
            }
            return { user, token }
        } else {
            throw { status: 401 }
        }
    },
    generateLoginObjectForUser: function (user) {
        let token = this.generateTokenForUser(user)

        return {
            user: user.toPublic(),
            token: token
        }
    },
    generateTokenForUser: function (user) {
        if (user.type === "temp") {
            return jwt.sign({ id: user._id, type: user.type }, secret)
        } else if (user._id) {
            return jwt.sign({ id: user._id }, secret)
        } else {
            return null
        }
    },
    decodeToken: function (token) {
        return jwt.verify(token, secret)
    },
    decodeTokenToUser: function (token, callback) {
        var decodedJWT = this.decodeToken(token)
        if (decodedJWT.type === "temp") {
            TempUser.findByIdAndUpdate(
                decodedJWT.id,
                { $set: { last_action_time: Date.now() } },
                { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false },
                callback
            )
        } else if (decodedJWT) {
            // set their last action time! Whoo this is so exciting!
            User.findByIdAndUpdate(
                decodedJWT.id,
                { $set: { last_action_time: Date.now() } },
                { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false },
                callback
            )
        } else {
            callback("Token invalid")
        }
    },
    middleware: function (req, res, next) {
        if (req.headers.authorization) {
            LoginController.decodeTokenToUser(req.headers.authorization, function (error, user) {
                if (user) {
                    req.user = user
                }
                next()
            })
        } else {

            next()
        }
    }
}

module.exports = LoginController
