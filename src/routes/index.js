// package imports
const router = require('express').Router()

// import the old routes
let users = require("./old/users")
let tempusers = require("./old/tempusers")
let readings = require("./old/readings")
let comments = require("./old/comments")
let projects = require("./old/projects")
let auth = require("./old/auth")
let mailchimp = require("./old/mailchimp")
let subscriptions = require("./old/subscriptions")

// attach old routes to the router
router.use("/users", users)
router.use("/tempusers", tempusers)
router.use("/readings", readings)
router.use("/projects", projects)
router.use("/auth", auth)
router.use("/mailchimp", mailchimp)
router.use("/subscriptions", subscriptions)

module.exports = router