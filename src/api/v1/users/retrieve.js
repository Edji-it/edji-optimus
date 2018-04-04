// this route is likely being called because GET /api/v1/users/:user_id/messages told the front-end to refresh the user
module.exports = function(req, res) {
  let user = req.user

  // check to see if the user is a valid Hero
  user.checkHeroStatus()
  .then((validHero) => {
    user.hero_status = validHero
    user.last_refresh_time = Date.now()

    // save the user with the upsated properties
    user.save(false, (err, result) => {
      err && console.error(err)
    })

    return res.status(200).send({ user: user.toPublic() })

  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}