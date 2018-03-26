// package imports
const router = require('express').Router()

// attach routes
router.use('/readings', require('./readings'))
router.use('/projects', require('./projects'))
router.use('/stripe', require('./stripe'))
router.use('/users', require('./users'))

module.exports = router