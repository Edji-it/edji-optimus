// library imports
import { Router } from 'express'

// project imports
import * as authRequired from './../../../middleware/auth-required'
import * as localOnly from './../../../middleware/local-only'
import { GetOutcomes } from './list-outcomes'
import { UpdateInstitution, UpdateInstitutionProperty } from './update'

const router: Router = Router()

router.get('/:institution_id', authRequired, require('./retrieve'))
router.get('/', localOnly, require('./list'))
router.post('/', authRequired, require('./create'))
router.get('/:institution_id/outcomes', authRequired, GetOutcomes)
router.put('/:institution_id', authRequired, UpdateInstitution)
router.put('/:institution_id/:update_property', authRequired, UpdateInstitutionProperty)

export const InstitutionsController: Router = router