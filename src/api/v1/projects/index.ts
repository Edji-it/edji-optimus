// library imports
import { Router } from 'express'

// middleware
import * as authRequired from './../../../middleware/auth-required'
import { UpdateProjectController, UpdatePropertyController } from './update'
import { RemovePropertyController } from './remove-property'
import validateController from './validate'
import { addRouteName } from '../../../utils/edji-utils'
import { deleteOwnerProject } from './../../../models/_Project'
import { sendResponse, validateIdParameters } from '../../../middleware'
import { createProject, getCommentsCopy } from './../../../models/_Project'
import { activateCustomCode } from './../../../models/_SessionCode'
import { middleware as LegacyAuth } from '../../../middleware/login-controller'
import { addUserToRequest } from '../../../middleware/login-controller'

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), LegacyAuth, authRequired, require('./list'))
router.post(
  '/',
  addRouteName('/'),
  LegacyAuth,
  authRequired,
  getCommentsCopy(),
  createProject(),
  activateCustomCode(),
  sendResponse(),
)
router.get('/:project_id', addRouteName('/:project_id'), LegacyAuth, require('./retrieve'))
router.put(
  '/:project_id',
  addRouteName('/:project_id'),
  addUserToRequest({}),
  validateIdParameters('project_id'),
  authRequired,
  UpdateProjectController,
)
router.delete(
  '/:project_id',
  addRouteName('/:project_id'),
  addUserToRequest(),
  authRequired,
  validateIdParameters('project_id'),
  deleteOwnerProject(),
  sendResponse(),
)
router.get('/:project_code/validate', addRouteName('/:project_code/validate'), LegacyAuth, validateController)
router.put(
  '/:project_id/:update_property',
  addRouteName('/:project_id/:update_property'),
  addUserToRequest({ fullname: true }),
  authRequired,
  validateIdParameters('project_id'),
  UpdatePropertyController,
)
router.delete(
  '/:project_id/:remove_property',
  addRouteName('/:project_id/:remove_property'),
  addUserToRequest(),
  authRequired,
  validateIdParameters('project_id'),
  RemovePropertyController,
)

export default router
