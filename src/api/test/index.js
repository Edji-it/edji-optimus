// package imports
const router = require('express').Router()

// project imports
import { StandardsController } from './standards'

// attach api versions to router
router.get('/check-max-heroes', require('./check-max-heroes'))
router.use('/standards', StandardsController)

// export router
module.exports = router