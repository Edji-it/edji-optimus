// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
const localOnly = require('./../../../middleware/local-only')

router.get('/:institution_id', authRequired, require('./retrieve'))
router.get('/', localOnly, require('./list'))
router.post('/', authRequired, require('./create'))

module.exports = router