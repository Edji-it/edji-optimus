// package imports
import { Router } from 'express'

// project imports
const authRequired = require('./../../../middleware/auth-required')
const addRouteName = require('./../../../utils/edji-utils').addRouteName

const router = Router()
router.put('/:license_id/accept', addRouteName('/:license_id/accept'), authRequired, require('./accept'))
router.put('/:license_id/invite', addRouteName(''), authRequired, require('./invite'))
router.post('/', addRouteName('/'), authRequired, require('./create'))
router.get('/', addRouteName('/'), authRequired, require('./retrieve'))

export default router
