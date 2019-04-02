// library imports
import { Router } from 'express'
import { addRouteName } from '../../../../utils/edji-utils'

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// attach route handlers
const router = Router()
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.put('/:subscription_id', addRouteName('/:subscription_id'), authRequired, require('./update'))
router.get('/', addRouteName('/'), authRequired, require('./list'))
router.delete('/', addRouteName('/'), authRequired, require('./delete'))

// export
export default router
