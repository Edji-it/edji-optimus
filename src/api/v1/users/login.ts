// library imports
import { RequestHandler } from 'express'

// project imports
import { login } from './../../../middleware/login-controller'

const loginHandler: RequestHandler = async function (req, res, next) {
  const { user } = req.body // note this is coming from the request's body, not the req.user

  if (!user || !user.username || !user.password) {
    return res.status(400).send({ error: 'user must have username and password' })
  }

  try {
    const result = await login(user)
    return res.status(200).send(result)
  } catch (err) {
    return next(err)
  }
}

export default loginHandler