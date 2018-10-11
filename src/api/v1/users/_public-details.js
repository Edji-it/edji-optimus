// library imports
const User = require('../../../models/User')
const TempUser = require('../../../models/TempUser')

let validateRequest = function (student_ids_req, temp_ids_req) {
  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (_idNull(student_ids_req) && _idNull(temp_ids_req)) {
    return true
  }
  return false
}

let stringToArray = function (string) {
  let arr = string.split(",")
  return arr
}

let initialQueryObject = function (student_ids_req, students_ids, temp_ids) {
  let queryObj
  // since we want to be flexible, the call can take both students_ids and temp_ids, or just one.. but we have to set this up to run just one if we're doing that
  if (!_idNull(student_ids_req)) {
    // case where we'll be searching by students_ids (and possibly temp_ids.. if not, we'll handle that later in the call)
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
    // case where we'll not be searching by students_ids (temp_ids only)
    queryObj = TempUser.find({
      _id: {
        $in: temp_ids
      }
    },{
      _id: 1,
      fullname: 1
    }).lean().exec()
  }
  return queryObj
}

let _idNull = function (_ids) {
  if (_ids==='') {
    return true
  }
  return false
}

module.exports = {
  validateRequest,
  stringToArray,
  initialQueryObject,
  _idNull
}