// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
import { TokenController } from './tokens'

router.use(require('./messages'))
router.use(require('./referrals'))
router.use('/tokens', function(req, res, next) { console.log('routing...'); next(); }, TokenController)
router.get('/:user_id', authRequired, require('./check-user-id'), require('./retrieve'))
router.put('/:user_id', authRequired, require('./update').updateUser)

module.exports = router