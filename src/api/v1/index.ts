// package imports
const router = require('express').Router()

// project imports
import StandardsRouter from './standards'
import InstitutionsRouter from './institutions'
import ProjectsRouter from './projects'
import AuthRouter from './auth'
import StripeRouter from './stripe'
import UsersRouter from './users'
import ReferralsRouter from './referrals'
import LicensesRouter from './licenses'
import TempUsersRouter from './temp_users'
import ReadingsRouter from './readings'
import { addRouteName } from '../../utils/edji-utils'
import { middleware as LegacyAuth } from '../../middleware/login-controller'

// attach routes
router.use('/readings', addRouteName('/readings'), LegacyAuth, ReadingsRouter)
router.use('/projects', addRouteName('/projects'), LegacyAuth, ProjectsRouter)
router.use('/auth', addRouteName('/auth'), LegacyAuth, AuthRouter)
router.use('/stripe', addRouteName('/stripe'), LegacyAuth, StripeRouter)
router.use('/users', addRouteName('/users'), LegacyAuth, UsersRouter)
router.use('/referrals', addRouteName('/referrals'), LegacyAuth, ReferralsRouter)
router.use('/licenses', addRouteName('/licenses'), LegacyAuth, LicensesRouter)
router.use('/institutions', addRouteName('/institutions'), LegacyAuth, InstitutionsRouter)
router.use('/temp_users', addRouteName('/temp_users'), LegacyAuth, TempUsersRouter)
router.use('/standards', addRouteName('/standards'), LegacyAuth, StandardsRouter)

export default router
