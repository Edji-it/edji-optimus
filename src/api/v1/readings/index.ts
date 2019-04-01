import { Router } from 'express'
import * as authRequired from './../../../middleware/auth-required'
import * as ListReadingsHandler from './list'
import { CreateReadingHandler } from './create'
import * as SendReportHandler from './reports'
import { TempTypeHandler } from './temp'
import SearchReadingsController from './search'
import { addRouteName } from '../../../utils/edji-utils'

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), authRequired, ListReadingsHandler)
router.post('/', addRouteName('/'), authRequired, CreateReadingHandler)
router.get('/_search', addRouteName('/_search'), authRequired, SearchReadingsController)
router.post('/reports', addRouteName('/reports'), authRequired, SendReportHandler)
router.get('/:temp_type', addRouteName('/:temp_type'), authRequired, TempTypeHandler)

export const ReadingsRouter = router