const User = require('./../../../models/User')
const LoginController = require('./../../../middleware/LoginController')

module.exports = function(req, res) {
  let user = User(req.body.user)

  user.save(false, (error, result) => {
    if (error){
      if (error.name === "ValidationError") {
        var errors = {}

        for (var property in error.errors) {
          if (error.errors[property].kind === "user defined") {
            errors[property] = error.errors[property].properties.kind
          } else {
            errors[property] = error.errors[property].kind
          }
        }

        return res.status(406).send({ validationErrors: errors })
      } else if (error.code === 11000) {
        return res.status(406).send(duplicateFieldErrorHandler(error))
      } else {
        console.error(error)
        return res.status(500).send()
      }
    } else {
      return res.status(201).json(LoginController.generateLoginObjectForUser(result))
    }
  })
}

let duplicateFieldErrorHandler = function(error) {
  // this is going to be a little hacky
  // we need to have all the possible duplicate indexes handled manually, unfortunately, since it doesn't give us the index
  let path
  if (error.message.indexOf('username') > -1) {
      path = 'username'
  } else if (error.message.indexOf('email') > -1) {
      path = 'email'
  }
  
  let message
  if (path) {
      message = 'duplicate key error for field: ' + path
  } else {
      message = 'error in determining duplicate path'
      console.error('a duplicate error was returned, but it could not be identified.', err)
  }
  
  return {
      duplicateFieldError: {
          message: message,
          field: path
      }
  }
}