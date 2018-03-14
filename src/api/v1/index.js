// package imports
const router = require('express').Router()

// attach routes
router.use('/readings', require('./readings'))
router.use('/projects', require('./projects'))
router.use('/subscriptions', require('./subscriptions'))

module.exports = router