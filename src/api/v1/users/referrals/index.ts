// library imports
import { Router } from 'express'

// project imports
import * as authRequired from './../../../../middleware/auth-required'
import * as checkId from './../check-user-id'
import { addRouteName } from '../../../../utils/edji-utils'

const router: Router = Router()

router.get('/:user_id/referrals', addRouteName('/:user_id/referrals'), authRequired, checkId, require('./retrieve').RetrieveRequestHandler)

export default router