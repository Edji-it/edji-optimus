module.exports = function (err, req, res, next) {
  if (err && err.type && err.type === 'oauth') {
    switch (err.code) {
      case "err_duplicate_user":
        const redirect = req.protocol + ":" + process.env.CLIENT_URL + "/#/oauth/google?error=duplicate_user"
        res.redirect(redirect)
        break
      default:
        next(err)
    }
  } else {
    next(err)
  }
}