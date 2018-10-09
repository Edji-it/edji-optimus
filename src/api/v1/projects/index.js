// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../middleware/auth-required')

// attach route handlers
router.get('/', authRequired, require('./list'))
router.get('/:project_id', authRequired, require('./retrieve'))

// export
module.exports = router