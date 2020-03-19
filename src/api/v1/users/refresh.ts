import { RequestHandler } from 'express'

import User from '../../../models/User'

const handler: RequestHandler = async (req, res, next) => {
  const userId = req.params.user_id
  const user = await User.findById(userId)
  if (user) {
    await user.edjiSave()
  }
  return res.status(200).send({ refreshed: !!user })
}

export default handler
