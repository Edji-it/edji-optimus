// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')

router.use(require('./messages'))
router.use(require('./referrals'))
router.get('/:user_id', authRequired, require('./check-user-id'), require('./retrieve'))
router.get('/password_recovery', require('./password_recovery'))

module.exports = router