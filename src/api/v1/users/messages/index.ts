// package imports
const router = require('express').Router()

// project imports
const authRequired = require('../../../../middleware/auth-required')
const checkId = require('./../check-user-id')
import { addRouteName } from '../../../../utils/edji-utils'
import { addUserToRequest } from '../../../../middleware/login-controller'

// attach routes
router.get(
  '/:user_id/messages',
  addRouteName('/:user_id/messages'),
  addUserToRequest({ message_list_id: true }),
  authRequired,
  checkId,
  require('./retrieve'),
)

export default router
