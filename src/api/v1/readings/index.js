// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../middleware/auth-required')

// attach route handlers
router.get('/', authRequired, require('./list'))
router.post('/', authRequired, require('./create').CreateReadingHandler)
router.post('/reports', authRequired, require('./reports'))

// export
module.exports = router