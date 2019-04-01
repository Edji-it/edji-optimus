// package imports
import { Router } from 'express'

// project imports
import { addRouteName } from '../../../utils/edji-utils'
import CustomersRouter from './customers'
import SubscriptionsRouter from './subscriptions'

// attach routes
const router = Router()
router.use('/subscriptions', addRouteName('/subscriptions'), SubscriptionsRouter)
router.use('/customers', addRouteName('/customers'), CustomersRouter)

export default router