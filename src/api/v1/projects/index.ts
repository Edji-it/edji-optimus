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

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), authRequired, require('./list'))
router.post(
  '/',
  addRouteName('/'),
  authRequired,
  getCommentsCopy(),
  createProject(),
  activateCustomCode(),
  sendResponse(),
)
router.get('/:project_id', addRouteName('/:project_id'), require('./retrieve'))
router.put(
  '/:project_id',
  addRouteName('/:project_id'),
  validateIdParameters('project_id'),
  authRequired,
  UpdateProjectController,
)
router.delete(
  '/:project_id',
  addRouteName('/:project_id'),
  authRequired,
  validateIdParameters('project_id'),
  deleteOwnerProject(),
  sendResponse(),
)
router.get('/:project_code/validate', addRouteName('/:project_code/validate'), validateController)
router.put(
  '/:project_id/:update_property',
  addRouteName('/:project_id/:update_property'),
  authRequired,
  validateIdParameters('project_id'),
  UpdatePropertyController,
)
router.delete(
  '/:project_id/:remove_property',
  addRouteName('/:project_id/:remove_property'),
  authRequired,
  validateIdParameters('project_id'),
  RemovePropertyController,
)

export default router
