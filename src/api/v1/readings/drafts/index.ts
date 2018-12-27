import { Router } from 'express'
import { ListDraftsHandler } from './list'

const router = Router()

router.get('/', ListDraftsHandler)

export const DraftsRouter = router