import { Router } from 'express'

// project imports
import * as authRequired from './../../../middleware/auth-required'
import { AddStandard } from './create'
import { GetStandards } from './list';
import { addRouteName } from '../../../utils/edji-utils'

const router: Router = Router()

// resetting password is the only property allowed to be done without auth
// thse are available locally only for now
router.get('/', addRouteName('/'), authRequired, GetStandards)
router.post('/', addRouteName('/'), authRequired, AddStandard)

export default router