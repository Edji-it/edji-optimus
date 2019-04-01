// library imports
import { Router } from 'express'

// controllers
import { CleverRedirect, CleverCallback } from './clever'
import { GoogleRedirect, GoogleCallback } from './google'
import { addRouteName } from '../../../utils/edji-utils'

const router = Router()

router.get('/clever', addRouteName('/clever'), CleverRedirect)
router.get('/clever/callback', addRouteName('/clever/callback') ,CleverCallback)
// router.get('/google', Passport.authenticate('google', { scope: ['email', 'profile'] }))
router.get('/google', addRouteName('/google'), GoogleRedirect)
router.get('/google/callback', addRouteName('/google/callback'), GoogleCallback)


export default router