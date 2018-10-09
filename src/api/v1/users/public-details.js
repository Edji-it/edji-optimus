// library imports
const Q = require('q')

// project imports
const User = require('../../../models/User')
const TempUser = require('../../../models/TempUser')

module.exports = function(req, res) {
  const students_ids = req.query.students_ids.split(",")
  const temp_ids = req.query.temp_ids.split(",")

  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (students_ids.length < 1 && temp_ids.length < 1) {
    return res.status(400).send({ error: 'no _ids to search for' })
  }

  Q(
    User.find({
      _id: {
        $in: students_ids
      }
    },{
      _id: 1,
      fullname: 1,
      username: 1
    }).lean().exec()
  )
  .then((projectUsers) => {
    users = projectUsers
    return TempUser.find({
      _id: {
        $in: temp_ids
      }
    },{
      _id: 1,
      fullname: 1
    }).lean()
  })
  .then((tempUsers) => {
    let userCount = users.length - 1
    let tempCount = tempUsers.length - 1
    // add a "user" label so we know what type of user this is
    for (var i=0; i<userCount; i++) {
      users[i].userType = "registered"
    }
    // add a "temp" label so we know what type of user this is
    for (var i=0; i<tempCount; i++) {
      tempUsers[i].userType = "temp"
    }
    // combine the user and temp info
    totalUsers = users.concat(tempUsers)
    // send back the project
    return res.status(200).send({ users: totalUsers })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}