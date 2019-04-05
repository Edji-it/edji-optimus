let validateRequest = function(students_ids, temp_ids) {
  // if we do not have any students or temp _ids in the request, we can go ahead and skip this
  if (_idNull(students_ids) && _idNull(temp_ids)) {
    return false
  }
  return true
}

let _idNull = function(_ids) {
  if (!_ids || (_ids && _ids[0] === '')) {
    return true
  }
  return false
}

module.exports = {
  validateRequest,
  _idNull,
}
