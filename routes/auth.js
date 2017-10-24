// these are oauth routes

const express = require('express')
const passport = require('passport')
const config = require('config')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Q = require('q')

let User = require("./../models/User")
let Passport = require("./../passport")
let router = express.Router()

router.get('/google', Passport.authenticate('google', { scope: ['email', 'profile'] }))

router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/google/callback',

    // Finish OAuth 2 flow using Passport.js
    //  session set to false so we can create user and pass back jwt without using separate session
    Passport.authenticate('google', { session: false }),

    // Redirect back to the original page, if any
    (req, res) => {
        // const redirect = 'http://edji.it'
        // delete req.session.oauth2return
        res.status(200).send({ success: true, user: req.user })
    }
)

module.exports = router