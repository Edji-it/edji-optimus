module.exports =  function(req, res, next) {
  if (req.hostname!='localhost') {
    return res.status(401).send()
  } else {
    next()
  }
}