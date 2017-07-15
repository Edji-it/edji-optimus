// these are oauth routes

const express = require('express')
const passport = require('passport')
const config = require('config')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Q = require('q')

let User = require("./../models/User")
let router = express.Router()

// before getting to the routes, let's do some passport configuration - may move this somewhere else eventually

function extractProfile (profile) {
    let imageUrl = ''
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value
    }
    return {
        fullname: profile.displayName,
        username: profile.emails[0].value,
        email: profile.emails[0].value,
        avatar: imageUrl,
        oauth: {
            type: profile.provider, // should always be google I think
            id: profile.id
        }
    }
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `done` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use('google', new GoogleStrategy({
    clientID: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_ID'),
    clientSecret: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_SECRET'),
    callbackURL: config.get('AUTH.GOOGLE.OAUTH2_CALLBACK'),
    accessType: 'offline'
}, (accessToken, refreshToken, profile, done) => {
    // Extract the minimal profile information we need from the profile object
    // provided by Google
    let user = User(extractProfile(profile))
    let saveDoc = user.toPublic()
    delete saveDoc._id
    
    // I probably need to query for the user to see if it exists before creating it...
    user.save(
        {
            query: { "oauth.type": user.oauth.type, "oauth.id": user.oauth.id },
            update: {
                $set: {
                    username: user.username,

                },
                $push: {
                    oauth: user.oauth[0]
                }
            }
        },
        (err, user) => {
            if (err) { console.error("err:", err) }
            else { console.log("user:", user) }
            done(err, user)
        }
    )

    // done(null, user) // need to create the user and pass the user to callback
}))

// read about these: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
passport.serializeUser((user, done) => {
  // user passed to callback above will be received here 
    done(null, user._id) // should pass user._id here instead
})
passport.deserializeUser((_id, done) => {
  // look the user up in the database by id and return it as second callback of done
  // _id is used as the key to get user's info from session
    done(null, _id)
    Q(User.findById(_id).exec())
        .then((user) => {
            return done(null, user)
        })
        .catch((err) => {
            console.error(err)
            return done(err)
        })
})

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }))

router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/google/callback',

    // Finish OAuth 2 flow using Passport.js
    passport.authenticate('google'),

    // Redirect back to the original page, if any
    (req, res) => {
        // const redirect = 'http://edji.it'
        delete req.session.oauth2return
        res.status(200).send({ success: true, user: req.user })
    }
)

module.exports = router