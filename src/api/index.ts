// package imports
import { Router } from 'express'

const router = Router()

import { addRouteName } from './../utils/edji-utils'
import v1 from './v1'

// attach api versions to router
router.use('/v1', addRouteName('/v1'), v1)

// export router
export default router
