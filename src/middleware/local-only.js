module.exports = function(req, res, next) {
  if (req.hostname == 'localhost' || req.hostname == '127.0.0.1') {
    next()
  } else {
    return res.status(404).send()
  }
}
