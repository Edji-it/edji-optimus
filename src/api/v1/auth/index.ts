// library imports
import { Router } from 'express'

// controllers
const authRequired = require('../../../middleware/auth-required')
import { addUserToRequest } from '../../../middleware'
import { oauthCallbackHandler, redirectToProvider } from './oauth'
import { addRouteName } from '../../../utils/edji-utils'
import { azureAuth } from './azure'

const router = Router()

router.get('/azure/immersive_reader', addUserToRequest(), authRequired, azureAuth)
router.get('/:type', addRouteName('/:type'), redirectToProvider)
router.get('/:type/callback', addRouteName('/:type/callback'), oauthCallbackHandler)

export default router
