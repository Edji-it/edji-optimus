import { Router } from 'express'

// project imports
import * as authRequired from './../../../middleware/auth-required'
import { AddStandard } from './create'
import { GetStandards } from './list';

const router: Router = Router()

// resetting password is the only property allowed to be done without auth
// thse are available locally only for now
router.get('/', authRequired, GetStandards)
router.post('/', authRequired, AddStandard)

export const StandardsController: Router = router