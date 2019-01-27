// library imports
import { Router } from 'express'

// middleware
import * as  authRequired from './../../../middleware/auth-required'
import createProject from './create'

const router = Router()

// attach route handlers
router.post('/', authRequired, createProject)
router.get('/', authRequired, require('./list'))
router.get('/:project_id', require('./retrieve'))

export default router