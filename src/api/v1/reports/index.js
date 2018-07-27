// package imports
const router = require('express').Router()

// attach routes
router.use('/reading', require('./reading'))

module.exports = router