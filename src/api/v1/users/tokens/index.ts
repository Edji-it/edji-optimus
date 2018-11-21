import { Router } from 'express'
import { SetTokenController } from './set-token'
import { UseTokenMiddleware } from './use-token'
import { ResetEmailHandler } from './reset-email'

const router: Router = Router()

router.get('/:token_name', SetTokenController)
router.post('/reset_email/:unhashed_token', UseTokenMiddleware, ResetEmailHandler)

export const TokenController: Router = router