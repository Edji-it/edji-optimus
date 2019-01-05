import { Router } from 'express'
import { SetTokenController } from './set-token'
import { ValidateTokenMiddleware } from './validate-token'
import { ResetPropertyHandler } from './reset-property'

const router: Router = Router()

router.get('/:reset_property', SetTokenController)

router.post(
  '/:reset_property/:unhashed_token',
  ValidateTokenMiddleware,
  ResetPropertyHandler
)

export const TokenController: Router = router