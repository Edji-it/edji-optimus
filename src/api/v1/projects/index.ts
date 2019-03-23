// library imports
import { Router } from 'express'

// middleware
import * as  authRequired from './../../../middleware/auth-required'
import createProject from './create'
import { UpdateProjectController, UpdatePropertyController } from './update'
import { RemoverojectController, RemovePropertyController } from './remove-property'
import validateController from './validate'

const router = Router()

// attach route handlers
router.get('/', authRequired, require('./list'))
router.post('/', authRequired, createProject)
router.get('/:project_id', require('./retrieve'))
router.put('/:project_id', authRequired, UpdateProjectController)
router.get('/:project_code/validate', validateController)
router.put('/:project_id/:update_property', authRequired, UpdatePropertyController)
router.delete('/:project_id', authRequired, RemoveProjectController)
router.delete('/:project_id/:remove_property', authRequired, RemovePropertyController)

export default router
