// these are oauth routes

const express = require('express')
const passport = require('passport')
const config = require('config')
const GoogleStrategy = require('passport-google-oauth20').Strategy

let router = express.Router()

// before getting to the routes, let's do some passport configuration - may move this somewhere else eventually

function extractProfile (profile) {
    let imageUrl = ''
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value
    }
    return {
        id: profile.id,
        fullname: profile.displayName,
        email: profile.emails[0].value,
        avatar: imageUrl,
        type: profile.provider // should always be google I think
    }
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `cb` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new GoogleStrategy({
    clientID: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_ID'),
    clientSecret: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_SECRET'),
    callbackURL: config.get('AUTH.GOOGLE.OAUTH2_CALLBACK'),
    accessType: 'offline'
}, (accessToken, refreshToken, profile, cb) => {
<<<<<<< HEAD
    console.log("got a response from the google strat")
    // Extract the minimal profile information we need from the profile object
    // provided by Google
    let user = extractProfile(profile)
    cb(null, user)
    console.log(user)
}))

passport.serializeUser((user, cb) => {
    cb(null, user);
})
passport.deserializeUser((obj, cb) => {
    cb(null, obj);
=======
    // Extract the minimal profile information we need from the profile object
    // provided by Google
    console.log(profile)
    let user = extractProfile(profile)
    cb(null, user) // need to create the user and pass the user to callback
    console.log(user)
}))

// read about these: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
passport.serializeUser((user, done) => {
  // user passed to callback above will be received here 
    done(null, user) // should pass user._id here instead
})
passport.deserializeUser((_id, done) => {
  // look the user up in the database by id and return it as second callback of done
  // _id is used as the key to get user's info from session
    done(null, _id)
>>>>>>> dev
})

router.get('/testlogin', passport.authenticate('google', { scope: ['email', 'profile'] }))

router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/google/callback',
<<<<<<< HEAD
    (req, res, next) => {
        console.log("auth callback got hit!")
        next()
    },
=======
>>>>>>> dev

    // Finish OAuth 2 flow using Passport.js
    passport.authenticate('google'),

    // Redirect back to the original page, if any
    (req, res) => {
<<<<<<< HEAD
        console.log("got the Google request!!!!!!!!!!!!!!!!!!!!!")
=======
>>>>>>> dev
        const redirect = 'http://edji.it'
        delete req.session.oauth2return
        res.redirect(redirect)
    }
)

module.exports = router