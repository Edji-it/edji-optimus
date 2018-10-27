// this route is likely being called because GET /api/v1/users/:user_id/messages told the front-end to refresh the user
module.exports = function (req, res, next) {
  let user = req.user

  user.refresh()
    .then((refreshedUser) => {
      return res.status(200).send({ user: refreshedUser.toPublic() })
    })
    .catch((err) => {
      next(err)
    })
}