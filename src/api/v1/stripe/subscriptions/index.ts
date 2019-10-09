// library imports
import { Router } from 'express'
import { addRouteName } from '../../../../utils/edji-utils'

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// project imports
import DeleteSubscription from './delete'
import UpdateSubscription from './update'

// attach route handlers
const router = Router()
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.put('/:subscription_id', addRouteName('/:subscription_id'), authRequired, UpdateSubscription)
router.get('/', addRouteName('/'), authRequired, require('./list'))
router.delete('/', addRouteName('/'), authRequired, DeleteSubscription)

// export
export default router
