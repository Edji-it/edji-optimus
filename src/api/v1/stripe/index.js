// package imports
const router = require('express').Router()

// attach routes
router.use('/subscriptions', require('./subscriptions'))

module.exports = router