import { Router } from 'express'
import { SetTokenController } from './set-token'

const router: Router = Router()

router.post('/test', function(req, res) {
  res.status(200).send('this works')
})

router.post('/:token_name', SetTokenController)

export const TokenController: Router = router