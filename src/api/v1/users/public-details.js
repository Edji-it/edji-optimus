// library imports
const Q = require('q')
let mongoose = require("mongoose")

// project imports
const User = require('../../../models/User')
const TempUser = require('../../../models/TempUser')
const helpers = require('./_public-details')

module.exports = function(req, res) {
  // request query params for students_ids and temp_ids (either can be empty for this to work)
  const students = req.query.students_ids
  const temps = req.query.temp_ids

  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (!helpers.validateRequest(students, temps)) {
    return res.status(400).send({ error: 'no _ids to search for' })
  }

  // set up the _id arrays to convert them all to ObjectIds if the array is not empty
  let students_ids = []
  let temp_ids = []
  if (!helpers._idNull(students)) {
    students_ids = students.map(val => {
      return mongoose.Types.ObjectId(val)
    })
  }
  if (!helpers._idNull(temps)) {
    temp_ids = temps.map(val => {
      return mongoose.Types.ObjectId(val)
    })
  }

  // the arrays that we'll get from searching both collections -- needs to initialize as an empty array 
  let users = []
  let tempUsers = []

  Q(
    User.aggregate([
      {
        $match: { 
          _id: {
            $in: students_ids
          }
        }
      },{
        $project: {
          _id: 1,
          fullname: 1,
          username: 1,
          "userType": "registered"
        }
      }
    ]).exec()
  )
  .then((returnedUsers) => {
    // set users
    users = returnedUsers
    return TempUser.aggregate([
      {
        $match: { 
          _id: {
            $in: temp_ids
          }
        }
      },{
        $project: {
          _id: 1,
          fullname: 1,
          "userType": "temp"
        }
      }
    ])
  }).then((returnedTempUsers) => {
    // set tempUsers
    tempUsers = returnedTempUsers
    // combine the user and temp info
    totalUsers = helpers.combineArrays(users, tempUsers)
    
    // send back the users
    return res.status(200).send({ users: totalUsers })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}