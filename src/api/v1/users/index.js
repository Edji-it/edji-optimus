// package imports
// const router = require('express').Router()
import { Router } from 'express'
const router = Router()

// project imports
const authRequired = require('../../../middleware/auth-required')
import { TokenController } from './tokens'
import LinkController from './link'

router.post('/', require('./create').default)
router.post('/login', require('./login').default)
router.use(require('./messages'))
router.use(require('./referrals'))
router.use('/tokens', TokenController)
router.get('/public-details', require('./public-details'))
router.get('/:user_id', authRequired, require('./check-user-id'), require('./retrieve'))
router.put('/@me/link', authRequired, LinkController)
router.post('/@me/change_password', authRequired, require('./change-pass').default)

export default router