// package imports
const router = require('express').Router()

// import the old routes
let users = require('./users')
let tempusers = require('./tempusers')
let projects = require('./projects')
let auth = require('./auth').default
let mailchimp = require('./mailchimp')
let subscriptions = require('./subscriptions')

// attach old routes to the router
router.use('/users', users)
router.use('/tempusers', tempusers)
router.use('/projects', projects)
router.use('/auth', auth)
router.use('/mailchimp', mailchimp)
router.use('/subscriptions', subscriptions)
// Retired routes
// router.use('/readings', readings)

module.exports = router
