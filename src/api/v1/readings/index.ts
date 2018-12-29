import { Router } from 'express'
import * as authRequired from './../../../middleware/auth-required'
import * as ListReadingsHandler from './list'
import { CreateReadingHandler } from './create'
import * as SendReportHandler from './reports'
import { TempTypeHandler } from './temp'

const router = Router()

// attach route handlers
router.get('/', authRequired, ListReadingsHandler)
router.get('/:temp_type', authRequired, TempTypeHandler)
router.post('/', authRequired, CreateReadingHandler)
router.post('/reports', authRequired, SendReportHandler)

export const ReadingsRouter = router