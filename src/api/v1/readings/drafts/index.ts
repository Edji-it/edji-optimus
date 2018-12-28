import { Router } from 'express'
import { ListDraftsHandler } from './list'
import * as authRequired from './../../../../middleware/auth-required'

const router = Router()

router.get('/', authRequired, ListDraftsHandler)

export const DraftsRouter = router