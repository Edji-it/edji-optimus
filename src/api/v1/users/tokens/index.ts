import { Router } from 'express'
import { SetTokenController } from './set-token'
import { UseTokenMiddleware } from './use-token'
import { ResetPropertyHandler } from './reset-property'

const router: Router = Router()

router.get('/:reset_property', SetTokenController)

router.post(
  '/:reset_property/:unhashed_token',
  UseTokenMiddleware,
  ResetPropertyHandler()
)

export const TokenController: Router = router