// library imports
const Q = require('q')
let mongoose = require( "mongoose")

// project imports
const User = require('./../../../models/User')

module.exports = function(req, res) {
  const user_id = req.params.user_id

  Q(
    User.findbyId(
      
    ).exec()
  )
  .then((users) => {
    // if project is null (meaning it did not exist in the collection)
    if (!users || users.length < 1) {
      return res.status(404).send()
    }
    // send back the project
    return res.status(200).send({ users: users })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}