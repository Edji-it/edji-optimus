// library imports
import { Router } from 'express'
import { addRouteName } from '../../../../utils/edji-utils'

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// attach route handlers
const router = Router()
router.get('/:stripe_id', addRouteName('/:stripe_id'), authRequired, require('./retrieve'))

// export
export default router