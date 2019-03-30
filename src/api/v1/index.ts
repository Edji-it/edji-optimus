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
import { addRouteName } from '../../utils/edji-utils'

// attach routes
router.use('/readings', addRouteName('/readings'), require('./readings').ReadingsRouter)
router.use('/projects', addRouteName('/projects'), ProjectsRouter)
router.use('/auth', addRouteName('/auth'), AuthRouter)
router.use('/stripe', addRouteName('/stripe'), StripeRouter)
router.use('/users', addRouteName('/users'), UsersRouter)
router.use('/referrals', addRouteName('/referrals'), ReferralsRouter)
router.use('/licenses', addRouteName('/licenses'), LicensesRouter)
router.use('/institutions', addRouteName('/institutions'), InstitutionsRouter)
router.use('/temp_users', addRouteName('/temp_users'), TempUsersRouter)
router.use('/standards', addRouteName('/standards'), StandardsRouter)

export default router