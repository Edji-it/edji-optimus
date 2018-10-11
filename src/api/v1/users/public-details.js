// library imports
const Q = require('q')

// project imports
const User = require('../../../models/User')
const TempUser = require('../../../models/TempUser')
const helpers = require('./_public-details')

module.exports = function(req, res) {
  // request query params for students_ids and temp_ids (either can be empty for this to work)
  const student_ids_req = req.query.students_ids
  const temp_ids_req = req.query.temp_ids

  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (helpers.validateRequest(student_ids_req, temp_ids_req)) {
    return res.status(400).send({ error: 'no _ids to search for' })
  }
  // convert the request query params in to array of ObjectIds
  const students_ids = helpers.stringToArray(student_ids_req)
  const temp_ids = helpers.stringToArray(temp_ids_req)

  Q(
    // determine if we're starting with the User or TempUser collections to search by (dictated by request query params)
    helpers.initialQueryObject(student_ids_req, students_ids, temp_ids)
  )
  .then((projectUsers) => {
    if (!helpers._idNull(student_ids_req)) {
      // port the user properties to the next stage
      users = projectUsers
      if (!helpers._idNull(temp_ids[0])) {
        // if we're searching for temp_ids, then we'll need to handle the return to the next stage here
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
      // if we're not searching by students_ids, nullify the users so we don't mix up temps and students
      users = null
      return projectUsers // these are actually tempUsers that we'll move to the next then
    }
  })
  .then((tempUsers) => {
    if (users) {
      users = helpers.addUserType(users, "registered")
    }
    if (tempUsers) {
      tempUsers = helpers.addUserType(tempUsers, "temp")
    }

    // combine the user and temp info
    totalUsers = helpers.combineArrays(users, tempUsers)
    
    // send back the project
    return res.status(200).send({ users: totalUsers })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}