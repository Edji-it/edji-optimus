import { Router } from 'express'

// project imports
import * as localOnly from './../../../middleware/local-only'
import { AddStandard } from './create'
import { GetStandards } from './retrieve';

const router: Router = Router()

// resetting password is the only property allowed to be done without auth
router.get('/', localOnly, GetStandards)
router.post('/', localOnly, AddStandard)

export const StandardsController: Router = router