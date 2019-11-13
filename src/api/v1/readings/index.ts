import { Router } from 'express'

import * as ListReadingsHandler from './list'
import CreateReadingHandler from './create'
import * as SendReportHandler from './reports'
import { TempTypeHandler } from './temp'
import SearchReadingsController from './search'

import * as authRequired from './../../../middleware/auth-required'
import { validateIdParameters } from './../../../middleware'
import { addRouteName } from '../../../utils/edji-utils'
import { deleteOwnerReading, deleteReadingRelatedContent, READING_CAN_UPDATE } from './../../../models/_Reading'
import { simpleUpdate } from '../../../middleware/modify-model'
import Reading from './../../../models/Reading'

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), authRequired, ListReadingsHandler)
router.post('/', addRouteName('/'), authRequired, CreateReadingHandler)
router.get('/_search', addRouteName('/_search'), SearchReadingsController)
router.post('/reports', addRouteName('/reports'), authRequired, SendReportHandler)
router.get('/:temp_type', addRouteName('/:temp_type'), authRequired, TempTypeHandler)
router.put(
  '/:reading_id',
  addRouteName('/:reading_id'),
  authRequired,
  validateIdParameters('reading_id'),
  simpleUpdate(Reading, 'reading_id', READING_CAN_UPDATE),
)
router.delete(
  '/:reading_id',
  addRouteName('/:reading_id'),
  authRequired,
  validateIdParameters('reading_id'),
  deleteOwnerReading(),
  deleteReadingRelatedContent(),
)

export default router
