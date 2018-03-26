module.exports = function(req, res, next) {
  let user = req.user
  let user_id = req.params.user_id

  if (!user || !user_id) {
    return next(new Error('check-user-id middleware failed to pass id check: user or user_id undefined'))
  }

  if (user._id == user_id) {
    return next()
  } else {
    return next(new Error('check-user-id middleware failed to pass id check: requested id does not match users id'))
  }
  next()
}