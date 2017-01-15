var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")
var data = require("./data")

var seedDB = function() {
  return new Promise((resolve, reject) => {
    //removes all users in database
    User.remove({}).then((results) => {
      // registers and logs in user
      registerUser(data.users.testUser)
        .then((user) => {
          loginUser(data.users.testUserCreds)
            .then((res) => {
              resolve(res.body.token)
            })
        })
    })
  })
}

var loginUser = function(credentials) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post("/users/login")
      .send(credentials)
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res) }
      })
  })
}

var registerUser = function(userData) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post("/users")
      .send({user: userData})
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res) }
      })
  })
}

module.exports = {
  seedDB: seedDB,
  loginUser: loginUser,
  registerUser: registerUser
}