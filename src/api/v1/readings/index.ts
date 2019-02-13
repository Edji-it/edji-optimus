import { Router } from 'express'
import * as authRequired from './../../../middleware/auth-required'
import * as ListReadingsHandler from './list'
import { CreateReadingHandler } from './create'
import * as SendReportHandler from './reports'
import { TempTypeHandler } from './temp'
import SearchReadingsController from './search'

const router = Router()

// attach route handlers
router.get('/', authRequired, ListReadingsHandler)
router.post('/', authRequired, CreateReadingHandler)
router.get('/_search', authRequired, SearchReadingsController)
router.post('/reports', authRequired, SendReportHandler)
router.get('/:temp_type', authRequired, TempTypeHandler)

export const ReadingsRouter = router