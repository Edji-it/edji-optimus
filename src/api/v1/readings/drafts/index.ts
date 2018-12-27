import { Router } from 'express'
import { ListDraftsHandler } from './list'

const router = Router()

router.use('/', ListDraftsHandler)

export const DraftsRouter = router