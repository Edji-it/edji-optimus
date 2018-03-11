// package imports
const router = require('express').Router()

// attach routes
router.use('/readings', require('./readings'))

module.exports = router