// sets up local environment with .env file
require('dotenv').config()

// package imports
const express = require("express")
const bodyParser = require("body-parser")
const methodOverride = require("method-override")
const mongoose = require("mongoose")
const User = require("./models/User")
const LoginController = require("./middleware/LoginController")
const headerManagement = require('./middleware/header-management')
const util = require('util')
const passport = require('passport') // passport gets configured elsewhere
const responseTime = require('response-time') // middleware that adds header with the total elapsed time of call

const config = require('./../config') // make sure that the config is set up

// configure express
var app = express()
app.use(responseTime())
app.use(bodyParser.json({limit: '20mb'}))

// this is required for sockets... which are no longer here... but we left it in anyhow
var server = require('http').createServer(app)

app.use(passport.initialize())

app.use(LoginController.middleware)

// Access allowed for development
app.use(headerManagement)

// attach the new routes
app.use('/api', require('./api'))

// attach the old routes
app.use(require('./routes'))


// error handlers should come last!
app.use(methodOverride()) // this passes the errors through middleware
// handler for oauth errors
app.use((err, req, res, next) => {
    if (err && err.type && err.type == 'oauth') {
        switch (err.code) {
            case "err_duplicate_user":
                const redirect = req.protocol + ":" + process.env.CLIENT_URL + "/#/oauth/google?error=duplicate_user"
                res.redirect(redirect)
                break
            default:
                next(err)
        }
    } else {
        next(err)
    }
})

let port = process.env.PORT || 3354

server.listen(port, () => {
    console.log("Server connected at " + port)
})

server.timeout = 10000

module.exports = server