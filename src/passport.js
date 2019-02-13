const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const OAuth2Strategy = require('passport-oauth2')
const bcrypt = require('bcryptjs')
const rp = require('request-promise-native')

const GOOGLE_CALLBACK_URL = process.env.OPTIMUS_URL + "/auth/google/callback"
const CLEVER_CALLBACK_URL = `${process.env.OPTIMUS_URL}/auth/clever/callback`

let User = require("./models/User")

function extractProfile(profile) {
    let imageUrl = ''
    let singleUseToken = bcrypt.hashSync(profile.id + Date.now().toString(), 4) // important to use syncronus hashing here
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value
    }
    return {
        fullname: profile.displayName,
        email: profile.emails[0].value,
        avatar: imageUrl,
        oauth: [{
            type: profile.provider, // should always be google I think
            id: profile.id,
            singleUseToken: singleUseToken,
            singleUseTokenExpiration: Date.now() + (1000 * 60) // set token expiration to 1 minute
        }]
    }
}

passport.use('clever', new OAuth2Strategy({
    authorizationURL: 'https://clever.com/oauth/authorize',
    tokenURL: 'https://clever.com/oauth/tokens',
    clientID: process.env.OAUTH2_CLEVER_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLEVER_CLIENT_SECRET,
    callbackURL: CLEVER_CALLBACK_URL,
    customHeaders: {
        'Authorization': 'Basic ' + new Buffer(process.env.OAUTH2_CLEVER_CLIENT_ID + ':' + process.env.OAUTH2_CLEVER_CLIENT_SECRET).toString('base64')
    }
}, async (accessToken, refreshToken, alwaysEmpty, done) => {
    console.log('got to the passport handler')
    // console.log('profile:', profile)
    const rpOptions = {
        auth: {
            bearer: accessToken
        },
        json: true
    }

    try {
        let { type, data } = await rp.get({
            url: 'https://api.clever.com/v2.0/me',
            ...rpOptions
        })
        // console.log('res', res)
        let { data: teacher } = await rp.get({
            url: 'https://api.clever.com/v2.0/teachers/' + data.id,
            ...rpOptions
        })
        console.log('teacher', teacher)
    } catch (err) {
        done(err)
    }

    return done(null, { user: 'we can make a user!!' })
}))

// Configure the Google strategy for use by Passport.js.
//
// OAuth2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `done` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use('google', new GoogleStrategy({
    clientID: process.env.OAUTH2_GOOGLE_CLIENT_ID,
    clientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    accessType: 'offline',
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    // Extract the minimal profile information we need from the profile object
    // provided by Google and turn that into a User object
    let user = User(extractProfile(profile))

    // query for a user that has an oauth type and id matching the auth'd user
    const userQuery = { "oauth.type": user.oauth[0].type, "oauth.id": user.oauth[0].id }

    // using the user's id given by oauth, try and look them up and update the single use token and expiration
    try {
        let dbUser = await User.findOneAndUpdate(
            userQuery,
            {
                $set: {
                    'oauth.$.singleUseToken': user.oauth[0].singleUseToken,
                    'oauth.$.singleUseTokenExpiration': user.oauth[0].singleUseTokenExpiration
                }
            }, {
                new: true,
                runValidators: true
            })
        if (!dbUser) {
            // here we know it's a new user, and we need to create them!!
            try {
                let newUser = await user.edjiSave({ forceSave: true })
                return done(null, newUser)
            } catch (err) {
                return done({ error: err, type: "oauth", code: "err_duplicate_user" })
            }
        } else {
            return done(null, dbUser)
        }
    } catch (err) {
        return done(err)
    }
}))

module.exports = passport