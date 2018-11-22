// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// attach route handlers
router.post('/', authRequired, require('./create'))
router.put('/:subscription_id', authRequired, require('./update'))
router.get('/', authRequired, require('./list'))
router.delete('/', authRequired, require('./delete'))

// export
module.exports = router