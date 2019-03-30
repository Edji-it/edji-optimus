// package imports
const router = require('./../utils/router').default()

// attach api versions to router
router.use('/v1', require('./v1').default)
router.use('/test', require('./test').default)

// export router
export default router