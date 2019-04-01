// package imports
import { Router } from 'express'
import { addRouteName } from '../../../utils/edji-utils'

// attach routes
const router = Router()
router.put('/convert/:temp_id', addRouteName('/convert/:temp_id'), require('./convert'))

export default router