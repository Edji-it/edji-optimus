// library imports
import { RequestHandler } from 'express'

// project imports
import { login, generateLoginObjectForUser } from './../../../middleware/login-controller'

const loginHandler: RequestHandler = async function(req, res, next) {
  const { user: creds } = req.body // note this is coming from the request's body, not the req.user

  if (!creds || !creds.username || !creds.password) {
    return res.status(400).send({ error: 'user must have username and password' })
  }

  try {
    const user = await login(creds)
    if (!user) throw { status: 401 }
    await user.refresh()
    const result = generateLoginObjectForUser(user)
    if (!result.user || !result.token) throw { status: 401 }
    return res.status(200).send(result)
  } catch (err) {
    if (err.status) {
      return res.status(err.status).send()
    }
    return next(err)
  }
}

export default loginHandler
