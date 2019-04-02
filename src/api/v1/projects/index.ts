// library imports
import { Router } from 'express'

// middleware
import * as authRequired from './../../../middleware/auth-required'
import createProject from './create'
import { UpdateProjectController, UpdatePropertyController } from './update'
import { RemoveProjectController, RemovePropertyController } from './remove-property'
import validateController from './validate'
import { addRouteName } from '../../../utils/edji-utils'

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), authRequired, require('./list'))
router.post('/', addRouteName('/'), authRequired, createProject)
router.get('/:project_id', addRouteName('/:project_id'), require('./retrieve'))
router.put('/:project_id', addRouteName('/:project_id'), authRequired, UpdateProjectController)
router.get('/:project_code/validate', addRouteName('/:project_code/validate'), validateController)
router.put(
  '/:project_id/:update_property',
  addRouteName('/:project_id/:update_property'),
  authRequired,
  UpdatePropertyController,
)
router.delete('/:project_id', addRouteName('/:project_id'), authRequired, RemoveProjectController)
router.delete(
  '/:project_id/:remove_property',
  addRouteName('/:project_id/:remove_property'),
  authRequired,
  RemovePropertyController,
)

export default router
