// library imports
import { Router } from 'express'

// middleware
import * as  authRequired from './../../../middleware/auth-required'
import createProject from './create'
import { UpdateProjectController, UpdatePropertyController } from './update'
import validateController from './validate'

const router = Router()

// attach route handlers
router.get('/', authRequired, require('./list'))
router.post('/', authRequired, createProject)
router.get('/:project_id', require('./retrieve'))
router.put('/:project_id', authRequired, UpdateProjectController)
router.get('/:project_code/validate', validateController)
router.put('/:project_id/:update_property', authRequired, UpdatePropertyController)

export default router