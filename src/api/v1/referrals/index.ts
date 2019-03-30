// library imports
import { Router } from 'express'

// attach route handlers
const router = Router()
router.get('/:referral_code', require('./retrieve'))

// export
export default router