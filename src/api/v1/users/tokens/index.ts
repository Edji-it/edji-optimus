import { Router } from 'express'
import { SetTokenController } from './set-token'
import { UseTokenController } from './use-token'

const router: Router = Router()

router.post('/:token_name', SetTokenController)
router.put('/:token_name/:unhashed_token', UseTokenController)

export const TokenController: Router = router