import { Router } from 'express'

import { SearchHandler } from './search'

const router = Router()

router.post('/:index', SearchHandler)

export const _SearchRouter = router