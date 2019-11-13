// package imports
const router = require('express').Router()

// import the old routes
const users = require('./users')
const tempusers = require('./tempusers')
const readings = require('./readings')
const projects = require('./projects')
const auth = require('./auth').default
const mailchimp = require('./mailchimp')
const subscriptions = require('./subscriptions')

// attach old routes to the router
router.use('/users', users)
router.use('/tempusers', tempusers)
router.use('/readings', readings)
router.use('/projects', projects)
router.use('/auth', auth)
router.use('/mailchimp', mailchimp)
router.use('/subscriptions', subscriptions)

module.exports = router
