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
import { GetAcademiesHandler } from './academies'
import { GetStateHandler, GetStatesHandler, PostStateHandler } from './state'
import { LegacyAuth, addUserToRequest } from '../../../middleware'

const router = Router()
router.post('/', addRouteName('/'), LegacyAuth, CreateHandler)
router.post('/login', addRouteName('/login'), LegacyAuth, LoginHandler)
router.use(MessagesRouter)
router.use(LegacyAuth, ReferralsRouter)
router.use('/tokens', addRouteName('/tokens'), LegacyAuth, TokenController)
router.get('/public-details', addRouteName('/public-details'), LegacyAuth, PublicDetailsHandler)
router.get(
  '/:user_id',
  addRouteName('/:user_id'),
  LegacyAuth,
  authRequired,
  require('./check-user-id'),
  require('./retrieve'),
)
router.put('/@me/link', addRouteName('/@me/link'), LegacyAuth, authRequired, LinkController)
router.post('/@me/change_password', LegacyAuth, authRequired, require('./change-pass').default)
router.get('/@me/state', addRouteName('/@me/state'), LegacyAuth, authRequired, GetStatesHandler)
router.get('/@me/state/:key', addRouteName('/@me/state/:key'), LegacyAuth, authRequired, GetStateHandler)
router.post('/@me/state/:key', addRouteName('/@me/state/:key'), LegacyAuth, authRequired, PostStateHandler)
router.get(
  '/@me/academies',
  addRouteName('/@me/academies'),
  addUserToRequest({ institution_ids: true }),
  authRequired,
  GetAcademiesHandler,
)

export default router
