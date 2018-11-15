// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// attach route handlers
router.post('/', authRequired, require('./create'))
router.delete('/:stripe_cust_id', authRequired, require('./delete'))

// export
module.exports = router