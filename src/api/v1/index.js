// package imports
const router = require('express').Router()

// attach routes
router.use('/readings', require('./readings'))
router.use('/projects', require('./projects'))
router.use('/stripe', require('./stripe'))
router.use('/users', require('./users'))
router.use('/referrals', require('./referrals'))
router.use('/licenses', require('./licenses'))
router.use('/institutions', require('./institutions'))

module.exports = router