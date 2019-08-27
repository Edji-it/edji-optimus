// package imports
import { Router } from 'express'

// project imports
const authRequired = require('./../../../middleware/auth-required')
const addRouteName = require('./../../../utils/edji-utils').addRouteName
import { validateIdParameters } from './../../../middleware'

import AcceptHandler from './accept'

const router = Router()
router.put(
  '/:license_id/accept',
  addRouteName('/:license_id/accept'),
  validateIdParameters('license_id'),
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
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.get('/', addRouteName('/'), authRequired, require('./retrieve'))

export default router
