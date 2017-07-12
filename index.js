/**
 * Created by bvfergus on 3/5/16.
 */

const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const User = require("./models/User")
const LoginController = require("./middleware/LoginController")
const middleware = require("./middleware/Middleware")
const util = require('util')
const config = require('config')
const session = require('express-session')
const passport = require('passport') // passport gets configured elsewhere

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
app.use(middleware.headerManagement)

//routers
let users = require("./routes/users")
let tempusers = require("./routes/tempusers")
let readings = require("./routes/readings")
let comments = require("./routes/comments")
let projects = require("./routes/projects")
let auth = require("./routes/auth")
var mailchimp = require("./routes/mailchimp")

// attach routes to the app
app.use("/users", users)
app.use("/tempusers", tempusers)
app.use("/readings", readings)
app.use("/projects", projects)
app.use("/auth", auth)
app.use("/mailchimp", mailchimp)

let port = process.env.PORT || 3354

server.listen(port, () => {
    console.log("Server connected at " + port)
})

server.timeout = 10000

module.exports = server