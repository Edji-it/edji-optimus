// sets up local environment with .env file
require('dotenv').config()

// package imports
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { EdjiUtils, addRouteName } = require('./utils/edji-utils')
const { LegacyAuth } = require('./middleware')

// initializes aws config and env vars
require('./services/aws')
require('./../config')

// setup error logging
global.__rootdir__ = __dirname || process.cwd() // needed for sourcemaps
const { initSentry, sentryRequestHandler } = require('./middleware/sentry')
initSentry()

// configure express
var app = express()
app.use(sentryRequestHandler())
const edji = new EdjiUtils({ appId: 'optimus' })
app.use(edji.attachLogs, edji.initContext)
app.use(bodyParser.json({ limit: '20mb' }))

// this is required for sockets... which are no longer here... but we left it in anyhow
var server = require('http').createServer(app)

// Access allowed for development
app.use(require('./middleware/header-management'))

// attach the new routes
app.use('/api', addRouteName('/api'), require('./api').default, require('./middleware/handle-http').sendResponse())

// attach the old routes
app.use(LegacyAuth, require('./routes'))

app.get('/healthcheck', require('./healthcheck'))

// error handlers should come last!
app.use(methodOverride()) // this passes the errors through middleware
app.use(require('./error-handlers').GeneralErrorHandlers)

const port = process.env.PORT || 3354

server.listen(port, () => {
  console.log('Server connected at ' + port)
})

server.timeout = 10000

module.exports = server
