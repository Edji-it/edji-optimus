import { Router } from 'express'
import * as authRequired from './../../../middleware/auth-required'
import * as ListReadingsHandler from './list'
import { CreateReadingHandler } from './create'
import * as SendReportHandler from './reports'
import { DraftsRouter } from './drafts'

const router = Router()

// attach route handlers
router.use('/drafts', DraftsRouter)
router.get('/', authRequired, ListReadingsHandler)
router.post('/', authRequired, CreateReadingHandler)
router.post('/reports', authRequired, SendReportHandler)

export const ReadingsRouter = router