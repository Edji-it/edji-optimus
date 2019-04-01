// package imports
// const router = require('express').Router()
import { Router } from 'express'

// project imports
const authRequired = require('../../../middleware/auth-required')
import { addRouteName } from '../../../utils/edji-utils'


import TokenController from './tokens'
import LinkController from './link'
import CreateHandler from './create'
import LoginHandler from './login'
import PublicDetailsHandler from './public-details'
import ReferralsRouter from './referrals'
import MessagesRouter from './messages'

const router = Router()
router.post('/', addRouteName('/'), CreateHandler)
router.post('/login', addRouteName('/login'), LoginHandler)
router.use(MessagesRouter)
router.use(ReferralsRouter)
router.use('/tokens', addRouteName('/tokens'), TokenController)
router.get('/public-details', addRouteName('/public-details'), PublicDetailsHandler)
router.get('/:user_id', addRouteName('/:user_id'), authRequired, require('./check-user-id'), require('./retrieve'))
router.put('/password_recovery', addRouteName('/password_recovery'), require('./password_recovery'))
router.put('/@me/link', addRouteName('/@me/link'), authRequired, LinkController)

export default router