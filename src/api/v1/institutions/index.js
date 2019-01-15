// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
const localOnly = require('./../../../middleware/local-only')
import { GetOutcomes } from './list-outcomes'
import { AddOutcome } from './add-outcome'

router.get('/:institution_id', authRequired, require('./retrieve'))
router.get('/', localOnly, require('./list'))
router.post('/', authRequired, require('./create'))
router.get('/:institution_id/outcomes', authRequired, GetOutcomes)
router.post('/:institution_id/outcomes', authRequired, AddOutcome)

module.exports = router