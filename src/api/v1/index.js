// package imports
const router = require('express').Router()

// attach routes
router.use('/users', require('./users'))

module.exports = router