// package imports
const router = require('express').Router()

// attach routes
router.put('/convert/:temp_id', require('./convert'))

module.exports = router