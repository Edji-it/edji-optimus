/**
 * Created by bvfergus on 3/5/16.
 */

const express = require("express")
const bodyParser = require("body-parser")
const methodOverride = require("method-override")
const mongoose = require("mongoose")
const User = require("./models/User")
const LoginController = require("./middleware/LoginController")
const middleware = require("./middleware/Middleware")
const util = require('util')
const config = require('config')
const passport = require('passport') // passport gets configured elsewhere
const responseTime = require('response-time') // middleware that adds header with the total elapsed time of call

// configure express
var app = express()
app.use(responseTime())
app.use(bodyParser.json({limit: '20mb'}))

// this is required for sockets... which are no longer here... but we left it in anyhow
var server = require('http').createServer(app)

app.use(passport.initialize())

app.use(LoginController.middleware)

// Access allowed for development
app.use(middleware.headerManagement)

//routers
let users = require("./routes/users")
let tempusers = require("./routes/tempusers")
let readings = require("./routes/readings")
let comments = require("./routes/comments")
let projects = require("./routes/projects")
let auth = require("./routes/auth")
let mailchimp = require("./routes/mailchimp")
let subscriptions = require("./routes/subscriptions")

// attach routes to the app
app.use("/users", users)
app.use("/tempusers", tempusers)
app.use("/readings", readings)
app.use("/projects", projects)
app.use("/auth", auth)
app.use("/mailchimp", mailchimp)
app.use("/subscriptions", subscriptions)

// error handlers should come last!
app.use(methodOverride()) // this passes the errors through middleware
// handler for oauth errors
app.use((err, req, res, next) => {
    if (err && err.type && err.type == 'oauth') {
        switch (err.code) {
            case "err_duplicate_user":
                const redirect = req.protocol + ":" + config.get('CLIENT_URL') + "/#/oauth/google?error=duplicate_user"
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