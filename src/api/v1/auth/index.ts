// library imports
import { Router } from 'express'

// controllers
import { CleverRedirect, CleverCallback } from './clever'
import { GoogleRedirect, CallbackHandler } from './google'
import { addRouteName } from '../../../utils/edji-utils'

const router = Router()

router.get('/clever', addRouteName('/clever'), CleverRedirect)
router.get('/clever/callback', addRouteName('/clever/callback'), CleverCallback)
router.get('/google', addRouteName('/google'), GoogleRedirect)
router.get('/:type/callback', addRouteName('/:type/callback'), CallbackHandler)

export default router
