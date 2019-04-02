import { Router } from 'express'
import { SetTokenController } from './set-token'
import { ValidateTokenMiddleware } from './validate-token'
import { ResetPropertyHandler } from './reset-property'
import * as authRequired from './../../../../middleware/auth-required'
import { PasswordHandler } from './find-user'
import { addRouteName } from '../../../../utils/edji-utils'

// resetting password is the only property allowed to be done without auth
const router: Router = Router()
router.get('/:reset_property', addRouteName('/:reset_property'), PasswordHandler, authRequired, SetTokenController)

router.post(
  '/:reset_property/:unhashed_token',
  addRouteName('/:reset_property/:unhashed_token'),
  ValidateTokenMiddleware,
  ResetPropertyHandler,
)

export default router
