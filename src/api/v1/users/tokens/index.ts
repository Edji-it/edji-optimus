import { Router } from 'express'
import { SetTokenController } from './set-token'
import { ValidateTokenMiddleware } from './validate-token'
import { ResetPropertyHandler } from './reset-property'
import * as authRequired from './../../../../middleware/auth-required'
import { PasswordHandler } from './find-user'

const router: Router = Router()

// resetting password is the only property allowed to be done without auth
router.get('/password', PasswordHandler, SetTokenController)
router.get('/:reset_property', authRequired, SetTokenController)

router.post(
  '/:reset_property/:unhashed_token',
  ValidateTokenMiddleware,
  ResetPropertyHandler
)

export const TokenController: Router = router