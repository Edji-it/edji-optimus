// package imports
const router = require('express').Router()

// attach routes
router.use('/readings', require('./readings').ReadingsRouter)
router.use('/projects', require('./projects').default)
router.use('/stripe', require('./stripe'))
router.use('/users', require('./users'))
router.use('/referrals', require('./referrals'))
router.use('/licenses', require('./licenses'))
router.use('/institutions', require('./institutions'))
router.use('/temp_users', require('./temp_users'))
router.use('/_search', require('./_search')._SearchRouter)

module.exports = router