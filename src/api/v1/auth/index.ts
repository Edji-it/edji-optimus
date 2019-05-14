// library imports
import { Router } from 'express'

// controllers
import { oauthCallbackHandler, redirectToProvider } from './oauth'
import { addRouteName } from '../../../utils/edji-utils'

const router = Router()

router.get('/:type', addRouteName('/:type'), redirectToProvider)
router.get('/:type/callback', addRouteName('/:type/callback'), oauthCallbackHandler)

export default router
