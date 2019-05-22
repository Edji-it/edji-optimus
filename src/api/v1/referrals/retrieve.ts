// library imports
import { pick } from 'underscore'
import { RequestHandler } from 'express'

// project imports
import User from '../../../models/User'

const RetrieveSubscriptionHandler: RequestHandler = async (req, res, next) => {
  const code = req.params.referral_code

  try {
    // if the user is not auth'd, or their code is not the same as the requested code, there's only limited info we'd like to return to them
    if (!req.user || req.user.referral_code !== code) {
      const user = await User.findOne({ referral_code: code }).exec()
      if (!user) {
        return res.status(400).send({ error: 'no user exists for the requested code' })
      }

      return res.status(200).send({ user: pick(user, ['fullname']) })
    } else {
      // here the user is auth'd to get the entire referral object, and does not need any user information
      // but we don't want to move the code over here yet because that would be more work
      return res.status(400).send({
        error:
          'this route does not yet return a user their referral information - use GET /users/referrals/:referral_code',
      })
    }
  } catch (err) {
    return next(err)
  }
}

export default RetrieveSubscriptionHandler
