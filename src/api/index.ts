// package imports
import { Router } from 'express'

const router = Router()

import { addRouteName } from './../utils/edji-utils'
import v1 from './v1'
import test from './test'

// attach api versions to router
router.use('/v1', addRouteName('/v1'), v1)
router.use('/test', addRouteName('/test'), test)

// export router
export default router