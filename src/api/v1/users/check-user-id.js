module.exports = function(req, res, next) {
  let user = req.user
  let user_id = req.params.user_id

  if (!user || !user_id) {
    return res.status(400).send({ error: 'user_id or user._id undefined for id check' })
  }

  if (user._id.equals(user_id)) {
    return next()
  } else {
    return res.status(401).send({})
  }
}