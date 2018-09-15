

let createQuery = function ({ username, email }) {
  if (username) {
    return { username }
  } else if (email) {
    return { email }
  } else {
    return
  }
}

module.exports = {
  createQuery: createQuery
}