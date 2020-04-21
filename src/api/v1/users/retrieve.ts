import { RequestHandler } from 'express'

// this route is likely being called because GET /api/v1/users/:user_id/messages told the front-end to refresh the user
const handler: RequestHandler = (req, res, next) => {
  const user = req.user

  if (user.type === 'temp') return res.status(200).send({ user: user.toPublic() })

  user
    .refresh()
    .then(refreshedUser => res.status(200).send({ user: refreshedUser.toPublic() }))
    .catch(err => next(err))
}

export default handler
