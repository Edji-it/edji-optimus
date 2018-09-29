// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
import { TokenController } from './tokens'

router.use(require('./messages'))
router.use(require('./referrals'))
router.use('/:user_id/tokens', authRequired, require('./check-user-id'), TokenController)
router.get('/:user_id', authRequired, require('./check-user-id'), require('./retrieve'))
router.put('/password_recovery', require('./password_recovery'))

module.exports = router