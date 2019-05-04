// library imports
import { Router } from 'express'

import RetrieveReferralHandler from './retrieve'

// attach route handlers
const router = Router()
router.get('/:referral_code', RetrieveReferralHandler)

// export
export default router
