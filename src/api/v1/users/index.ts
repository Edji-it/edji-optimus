// package imports
// const router = require('express').Router()
import { Router } from 'express'

// project imports
const authRequired = require('../../../middleware/auth-required')
import { addRouteName } from '../../../utils/edji-utils'

import TokenController from './tokens'
import LinkController from './link'
import UnlinkController from './unlink'
import CreateHandler from './create'
import LoginHandler from './login'
import PublicDetailsHandler from './public-details'
import ChangePasswordHandler from './change-pass'
import ReferralsRouter from './referrals'
import MessagesRouter from './messages'
import { GetAcademiesHandler } from './academies'
import { GetStateHandler, GetStatesHandler, PostStateHandler } from './state'
import { GetActivityRecapHandler, PostActivityRecapHandler } from './recent-activity'
import { LegacyAuth, addUserToRequest } from '../../../middleware'
import RefreshHandler from './refresh'
import RetrieveHandler from './retrieve'

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
  RetrieveHandler,
)
router.get('/:user_id/_refresh', RefreshHandler)
router.put('/@me/link', addRouteName('/@me/link'), LegacyAuth, authRequired, LinkController)
router.put('/@me/unlink', addRouteName('/@me/unlink'), LegacyAuth, authRequired, UnlinkController)
router.post('/@me/change_password', LegacyAuth, authRequired, ChangePasswordHandler)
router.post(
  '/@me/activity_recap',
  addRouteName('/@me/activity_recap'),
  LegacyAuth,
  authRequired,
  PostActivityRecapHandler,
)
router.get(
  '/@me/activity_recap',
  addRouteName('/@me/activity_recap'),
  LegacyAuth,
  authRequired,
  GetActivityRecapHandler,
)
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
