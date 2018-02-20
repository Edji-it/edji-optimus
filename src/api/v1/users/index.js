// package imports
const router = require('express').Router()

// attach route handlers
router.post('/', require('./create'))

// export
module.exports = router