// library imports
import { Router } from 'express'

// controllers
import { CleverRedirect, CleverCallback } from './clever'

const router = Router()

router.get('/clever', CleverRedirect)
router.get('/clever/callback', CleverCallback)

export default router