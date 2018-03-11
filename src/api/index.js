// package imports
const router = require('express').Router()

// attach api versions to router
router.use('/v1', require('./v1'))

// export router
module.exports = router