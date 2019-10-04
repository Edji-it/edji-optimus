// library imports
import { Router } from 'express'
import { addRouteName } from '../../../../utils/edji-utils'

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// project imports
import RetrieveCustomerHandler from './retrieve'
import RetrieveCardHandler from './retrieve-card'

// attach route handlers
const router = Router()
router.get('/:stripe_id', addRouteName('/:stripe_id'), authRequired, RetrieveCustomerHandler)
router.get('/:stripe_id/card', addRouteName('/:stripe_id/card'), authRequired, RetrieveCardHandler)

// export
export default router
