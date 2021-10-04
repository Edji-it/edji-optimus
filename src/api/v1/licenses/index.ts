// package imports
import { Router } from 'express'

// project imports
const authRequired = require('./../../../middleware/auth-required')
const addRouteName = require('./../../../utils/edji-utils').addRouteName
import { validateIdParameters } from './../../../middleware'

import AcceptHandler from './accept'
import RemoveHandler from './remove'

const router = Router()
router.put(
  '/:invite_id/accept',
  addRouteName('/:invite_id/accept'),
  validateIdParameters('invite_id'),
  authRequired,
  AcceptHandler,
)
router.put(
  '/:license_id/invite',
  addRouteName('/:license_id/invite'),
  authRequired,
  validateIdParameters('license_id'),
  require('./invite'),
)
router.put(
  '/:license_id/remove',
  addRouteName('/:license_id/remove'),
  authRequired,
  validateIdParameters('license_id'),
  RemoveHandler,
)
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.get('/', addRouteName('/'), authRequired, require('./retrieve'))

export default router
