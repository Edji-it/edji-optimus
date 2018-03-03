// library imports
const router = require('express').Router()

// attach route handlers
router.get('/', require('./list'))

// export
module.exports = router