var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")
var Code = require("./../models/SessionCode")
var data = require("./data")

var seedUsers = function() {
  return new Promise((resolve, reject) => {
    //removes all users in database
    User.remove({}).then((results) => {
      // registers and logs in user
      registerUser(data.users.testUser)
        .then((user) => {
          loginUser(data.users.testUserCreds)
            .then((res) => {
              resolve(res.body)
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

var createReading = function(reading, authToken) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post("/readings")
      .set("Authorization", authToken)
      .send({ reading: reading })
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res.body) }
      })
  })
}

// var createProject = function(project, authToken) {

// }

var createCode = function() {
  return new Promise((resolve, reject) => {
    Code.remove({}).then((result) => {
      var code = Code({ code: "1234" })
      code.save((err, res) => {
        if (err) { reject(err) }
        else { resolve(res) }
      })
    })
  })
}

module.exports = {
  seedUsers: seedUsers,
  loginUser: loginUser,
  registerUser: registerUser,
  createReading: createReading,
  createCode: createCode
}