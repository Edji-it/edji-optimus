// package imports
const router = require('express').Router()

// attach routes
router.use('/subscriptions', require('./subscriptions'))
router.use('/customers', require('./customers'))

module.exports = router