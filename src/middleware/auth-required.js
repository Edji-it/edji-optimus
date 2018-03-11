module.exports =  function(req, res, next) {
  if (!req.user) {
    res.status(401).send()
    next("unauthorized")
  } else {
    next()
  }
}