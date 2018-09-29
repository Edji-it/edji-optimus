// package imports
const router = require('express').Router()

// attach api versions to router
router.get('/check-max-heroes', require('./check-max-heroes'))

// export router
module.exports = router