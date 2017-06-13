/**
 * Created by bvfergus on 3/5/16.
 */

const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const User = require("./models/User")
const LoginController = require("./middleware/LoginController")
const util = require('util')
const config = require('config')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

// configure express
var app = express()
app.use(bodyParser.json({limit: '20mb'}))

// this is required for sockets... which are no longer here... but we left it in anyhow
var server = require('http').createServer(app)

// Configure the session and session storage.
const sessionConfig = {
    resave: false,
    saveUninitialized: false,
    secret: "uXp7igLyn3C^z;fvjZ6mVXMMojuFtqRmvNwfn6Ne",
    signed: true
}

app.use(passport.initialize())
app.use(session(sessionConfig))

app.use(LoginController.middleware)

// Access allowed for development
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*')
    var oneof = false
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        res.header('Access-Control-Allow-Credentials', true)
        oneof = true
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
        oneof = true
    }

    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        oneof = true
    } 
    // else {
    //     // Request headers you wish to allow
    //     res.header('Access-Control-Allow-Headers', 'authorization, content-type, accept, origin')
    // }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true)

    // Pass to next layer of middleware
    next()
})

//routers
var users = require("./routes/users")
var tempusers = require("./routes/tempusers")
var readings = require("./routes/readings")
var comments = require("./routes/comments")
var projects = require("./routes/projects")

// attach routes to the app
app.use("/users", users)
app.use("/tempusers", tempusers)
app.use("/readings", readings)
app.use("/projects", projects)


////////////CONSTRUCTION ZONE////////////

function extractProfile (profile) {
    let imageUrl = ''
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value
    }
    return {
        id: profile.id,
        displayName: profile.displayName,
        image: imageUrl
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
})

app.get('/auth/testlogin', passport.authenticate('google', { scope: ['email', 'profile'] }))

app.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/auth/google/callback',
    (req, res, next) => {
        console.log("auth callback got hit!")
        next()
    },

    // Finish OAuth 2 flow using Passport.js
    passport.authenticate('google'),

    // Redirect back to the original page, if any
    (req, res) => {
        console.log("got the Google request!!!!!!!!!!!!!!!!!!!!!")
        const redirect = 'http://edji.it'
        delete req.session.oauth2return
        res.redirect(redirect)
    }
)


////////////CONSTRUCTION ZONE////////////

var port = process.env.PORT || 3354

server.listen(port, () => {
    console.log("Server connected at " + port)
})

server.timeout = 10000

module.exports = server