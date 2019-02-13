// these are oauth routes

const express = require('express')
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
        if (req.oauth_error) {
            return res.status(400).send(req.oauth_error)
        }

        const oauthToken = encodeURIComponent(
            req.user.oauth.find((obj) => {
                return obj.type === 'google'
            }).singleUseToken
        )

        // should be changed to use req.baseUrl
        const redirect = req.protocol + ":" + process.env.CLIENT_URL + '/#/oauth/google?token=' + oauthToken

        return res.redirect(redirect)
    }
)

router.get('/clever', Passport.authenticate('clever', {}))

router.get(
    '/clever/callback',
    // (req, res, next) => {
    //     console.log('got to the callback url')
    //     console.log(req)
    //     next()
    // },
    Passport.authenticate('clever', { session: false }),
    (req, res) => {
        if (req.oauth_error) {
            return res.status(400).send(req.oauth_error)
        }

        const oauthToken = encodeURIComponent(
            req.user.oauth.find((obj) => {
                return obj.type === 'google'
            }).singleUseToken
        )

        // should be changed to use req.baseUrl
        const redirect = "https:" + process.env.CLIENT_URL + '/#/oauth/google?token=' + oauthToken

        return res.redirect(redirect)
    }
)

module.exports = router