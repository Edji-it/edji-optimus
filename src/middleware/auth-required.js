module.exports = function(req, res, next) {
  if (!req.user) {
    return res.status(401).send()
  } else {
    next()
  }
}
