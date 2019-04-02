// library imports
import { Router } from 'express'

// project imports
import * as authRequired from './../../../middleware/auth-required'
import * as localOnly from './../../../middleware/local-only'
import { GetOutcomes } from './list-outcomes'
import { UpdateInstitution, UpdateInstitutionProperty } from './update'
import { addRouteName } from '../../../utils/edji-utils'

const router: Router = Router()

router.get('/:institution_id', addRouteName('/:institution_id'), authRequired, require('./retrieve'))
router.get('/', addRouteName('/'), localOnly, require('./list'))
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.get('/:institution_id/outcomes', addRouteName('/:institution_id/outcomes'), authRequired, GetOutcomes)
router.put('/:institution_id', addRouteName('/:institution_id'), authRequired, UpdateInstitution)
router.put(
  '/:institution_id/:update_property',
  addRouteName('/:institution_id/:update_property'),
  authRequired,
  UpdateInstitutionProperty,
)

export default router
