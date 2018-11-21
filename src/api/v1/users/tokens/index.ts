import { Router } from 'express'
import { SetTokenController } from './set-token'
import { UseTokenController } from './use-token'

const router: Router = Router()

router.get('/:token_name', SetTokenController)
router.post('/:token_name/:unhashed_token', UseTokenController)

export const TokenController: Router = router