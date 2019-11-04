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
const LegacyAuth = require('../middleware/login-controller').middleware

// attach old routes to the router
router.use('/users', LegacyAuth, users)
router.use('/tempusers', LegacyAuth, tempusers)
router.use('/readings', LegacyAuth, readings)
router.use('/projects', LegacyAuth, projects)
router.use('/auth', LegacyAuth, auth)
router.use('/mailchimp', LegacyAuth, mailchimp)
router.use('/subscriptions', LegacyAuth, subscriptions)

module.exports = router
