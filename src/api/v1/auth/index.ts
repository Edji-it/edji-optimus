// library imports
import { Router } from 'express'

// controllers
import { CleverRedirect, CleverCallback } from './clever'
import { GoogleRedirect, GoogleCallback } from './google'

const router = Router()

router.get('/clever', CleverRedirect)
router.get('/clever/callback', CleverCallback)
// router.get('/google', Passport.authenticate('google', { scope: ['email', 'profile'] }))
router.get('/google', GoogleRedirect)
router.get('/google/callback', GoogleCallback)


export default router