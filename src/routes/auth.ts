// library imports
import { Router } from 'express'

// project imports
import { addRouteName } from '../utils/edji-utils'
import { redirectToProvider, oauthCallbackHandler } from '../api/v1/auth/oauth'

const router = Router()

/**
 * @deprecated 5/14/2019
 */
router.get('/:type', addRouteName('/google'), redirectToProvider)
/**
 * @deprecated 5/14/2019
 */
router.get('/:type/callback', addRouteName('/google/callback'), oauthCallbackHandler)

export default router
