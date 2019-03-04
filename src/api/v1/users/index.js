// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
import { TokenController } from './tokens'
import LinkController from './link'

router.use(require('./messages'))
router.use(require('./referrals'))
router.use('/tokens', TokenController)
router.get('/public-details', require('./public-details'))
router.get('/:user_id', authRequired, require('./check-user-id'), require('./retrieve'))
router.put('/password_recovery', require('./password_recovery'))
router.put('/@me/link', authRequired, LinkController)

module.exports = router