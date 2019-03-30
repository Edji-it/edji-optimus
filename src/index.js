// sets up local environment with .env file
require('dotenv').config()

// package imports
const express = require("express")
const bodyParser = require("body-parser")
const methodOverride = require("method-override")
const passport = require('passport') // passport gets configured elsewhere
const { EdjiUtils, addRouteName } = require('./utils/edji-utils')

// set up all environment variables
require('./../config')

// setup error logging
const Sentry = require('@sentry/node')
Sentry.init({
    dsn: 'https://c581687e3838434b859f1249b31d5a26@sentry.io/299438',
    environment: process.env.NODE_ENV
})

// configure express
var app = express()
app.use(Sentry.Handlers.requestHandler())
const edji = new EdjiUtils({ appId: 'optimus', doLog: true })
app.use(edji.attachLogs, edji.initContext)
app.use(bodyParser.json({ limit: '20mb' }))

// this is required for sockets... which are no longer here... but we left it in anyhow
var server = require('http').createServer(app)

app.use(passport.initialize())

app.use(require('./middleware/login-controller').middleware)

// Access allowed for development
app.use(require('./middleware/header-management'))

// sets user properties for sentry, if they exist
app.use(require('./middleware/sentry'))

// attach the new routes
app.use('/api', addRouteName('/api'), require('./api').default)

// attach the old routes
app.use(require('./routes'))

app.get('/healthcheck', require('./healthcheck'))

// error handlers should come last!
app.use(methodOverride()) // this passes the errors through middleware
app.use(require('./error-handlers').GeneralErrorHandlers)

let port = process.env.PORT || 3354

server.listen(port, () => {
    console.log("Server connected at " + port)
})

server.timeout = 10000

module.exports = server