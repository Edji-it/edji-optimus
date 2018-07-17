import { Router } from 'express'

const router: Router = Router()

router.post('/test', function(req, res) {
  res.status(200).send('this works')
})

export const TokenController: Router = router