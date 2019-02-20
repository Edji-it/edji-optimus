// these are oauth routes
const express = require('express')
const Passport = require("./../passport")
const router = express.Router()
const rp = require('request-promise-native')
const Clever = require('./../services/clever').default

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

const creds = {
    client: {
        id: process.env.OAUTH2_CLEVER_CLIENT_ID,
        secret: process.env.OAUTH2_CLEVER_CLIENT_SECRET
    },
    auth: {
        tokenHost: 'https://clever.com'
    }
};

const oauth2 = require('simple-oauth2').create(creds)

/**
 * @todo implement state for CORS security
 */
// Authorization oauth2 URI
const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: `http:${process.env.OPTIMUS_URL}/auth/clever/callback`,
    // scope: '<scope>', // clever auto-assigns scope for library apps
    // state: '<state>' //
})

router.get('/clever', (req, res, next) => {
    res.redirect(authorizationUri)
})

router.get('/clever/callback', async (req, res, next) => {
    // Get the access token object (the authorization code is given from the previous step).
    const tokenConfig = {
        code: req.query.code,
        redirect_uri: `http:${process.env.OPTIMUS_URL}/auth/clever/callback`
    }
    try {
        const { access_token } = await oauth2.authorizationCode.getToken(tokenConfig)
        // console.log('result', result)
        // const accessToken = oauth2.accessToken.create(result) // simple-oauth2 has some helper methods for refreshing/revoking access tokens if we need this in the future
        // console.log('token', accessToken)

        const rpOptions = {
            auth: {
                bearer: access_token
            },
            json: true
        }

        const client = new Clever(access_token)
        await client.init()
        let { data: profile } = await client.getUser()
        console.log('profile', profile)



        const redirect = "http:" + process.env.CLIENT_URL + '/#/oauth/clever?token'

        return res.redirect(redirect)
    } catch (err) {
        next(err)
    }
})

module.exports = router