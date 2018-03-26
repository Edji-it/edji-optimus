// package imports
const router = require('express').Router()

// // attach routes
// router.use(
//   '/:user_id',
//   require('./user_id/validate-user-id'),
//   require('./user_id')
// )
router.use(require('./messages'))

module.exports = router