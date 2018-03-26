module.exports = function(req, res, next) {
  if (req.params.user_id == req.user._id) {
    next()
  } else {
    next(new Error('check-user-id middleware failed to pass id check: requested id does not match users id'))
  }
  next()
}