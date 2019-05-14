// package imports
const router = require('express').Router()

// import the old routes
let users = require('./users')
let tempusers = require('./tempusers')
let readings = require('./readings')
// let comments = require("./comments")
let projects = require('./projects')
let auth = require('./auth').default
let mailchimp = require('./mailchimp')
let subscriptions = require('./subscriptions')

// attach old routes to the router
router.use('/users', users)
router.use('/tempusers', tempusers)
router.use('/readings', readings)
router.use('/projects', projects)
router.use('/auth', auth)
router.use('/mailchimp', mailchimp)
router.use('/subscriptions', subscriptions)

module.exports = router
