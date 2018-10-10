// library imports
const Q = require('q')

// project imports
const User = require('../../../models/User')
const TempUser = require('../../../models/TempUser')

module.exports = function(req, res) {
  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (req.query.students_ids==='' && req.query.temp_ids==='') {
    return res.status(400).send({ error: 'no _ids to search for' })
  }
  const students_ids = req.query.students_ids.split(",")
  const temp_ids = req.query.temp_ids.split(",")

  let queryObj
  let skipTempCall = false

  // since we want to be flexible, the call can take both students_ids and temp_ids, or just one.. but we have to set this up to run just one if we're doing that
  if (students_ids[0]!=='') {
    queryObj = User.find({
      _id: {
        $in: students_ids
      }
    },{
      _id: 1,
      fullname: 1,
      username: 1
    }).lean().exec()
  } else {
    skipTempCall = true
    queryObj = TempUser.find({
      _id: {
        $in: temp_ids
      }
    },{
      _id: 1,
      fullname: 1
    }).lean().exec()
  }

  Q(
    queryObj
  )
  .then((projectUsers) => {
    if (!skipTempCall) {
      users = projectUsers
      if (temp_ids[0]!=='') {
        return TempUser.find({
          _id: {
            $in: temp_ids
          }
        },{
          _id: 1,
          fullname: 1
        }).lean()
      }
    } else {
      users = null
      return projectUsers // these are actually tempUsers that we'll move to the next then
    }
  })
  .then((tempUsers) => {
    // declare array length variables
    let tempCount = 0
    let userCount = 0

    // if we get users back, set the array length
    if (users) {
      userCount = users.length
    }

    // if we get temp users back, set the array length
    if (tempUsers) {
      tempCount = tempUsers.length
    }

    // add a "user" label so we know what type of user this is
    for (var i=0; i<userCount; i++) {
      users[i].userType = "registered"
    }

    // add a "temp" label so we know what type of user this is
    for (var i=0; i<tempCount; i++) {
      tempUsers[i].userType = "temp"
    }

    // combine the user and temp info
    if (users && tempUsers) {
      totalUsers = users.concat(tempUsers)
    } else if (users && !tempUsers) {
      totalUsers = users
    } else if (!users && tempUsers) {
      totalUsers = tempUsers
    } else {
      totalUsers = []
    }
    
    // send back the project
    return res.status(200).send({ users: totalUsers })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}