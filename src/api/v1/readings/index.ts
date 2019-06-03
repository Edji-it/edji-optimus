import { Router } from 'express'

import * as ListReadingsHandler from './list'
import CreateReadingHandler from './create'
import * as SendReportHandler from './reports'
import { TempTypeHandler } from './temp'
import SearchReadingsController from './search'

import * as authRequired from './../../../middleware/auth-required'
import { validateIdParameters, sendResponse } from './../../../middleware'
import { addRouteName } from '../../../utils/edji-utils'
import { deleteOwnerReading, deleteReadingRelatedContent, READING_CAN_UPDATE } from './../../../models/_Reading'
import { simpleUpdate } from '../../../middleware/modify-model'
import * as Reading from './../../../models/Reading'

const router = Router()

// attach route handlers
router.get('/', addRouteName('/'), authRequired, ListReadingsHandler)
router.post('/', addRouteName('/'), authRequired, CreateReadingHandler)
router.get('/_search', addRouteName('/_search'), SearchReadingsController)
router.post('/reports', addRouteName('/reports'), authRequired, SendReportHandler)
router.get('/:temp_type', addRouteName('/:temp_type'), authRequired, TempTypeHandler)
/** @todo try moving the sendResponse middleware out of the explicit routes and into index */
/** @todo try generalizing the modifyReading middleware to validate/update given a list of properties */
router.put(
  '/:reading_id',
  addRouteName('/:reading_id'),
  authRequired,
  validateIdParameters('reading_id'),
  simpleUpdate(Reading, 'reading_id', READING_CAN_UPDATE),
  sendResponse(),
)
router.delete(
  '/:reading_id',
  addRouteName('/:reading_id'),
  authRequired,
  validateIdParameters('reading_id'),
  deleteOwnerReading(),
  deleteReadingRelatedContent(),
  sendResponse(),
)

export default router
