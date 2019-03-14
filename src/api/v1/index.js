// package imports
const router = require('express').Router()

// project imports
import { StandardsController } from './standards'
import { InstitutionsController } from './institutions'

// attach routes
router.use('/readings', require('./readings').ReadingsRouter)
router.use('/projects', require('./projects').default)
router.use('/auth', require('./auth').default)
router.use('/stripe', require('./stripe'))
router.use('/users', require('./users'))
router.use('/referrals', require('./referrals'))
router.use('/licenses', require('./licenses'))
router.use('/institutions', InstitutionsController)
router.use('/temp_users', require('./temp_users'))
router.use('/_search', require('./_search')._SearchRouter)
router.use('/standards', StandardsController)

module.exports = router