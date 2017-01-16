var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")
var Code = require("./../models/SessionCode")
var Project = require("./../models/Project")
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


// seeds several codes into the SessionCodes in database (they have to be unique)
var createCodes = function() {
  var codes = ["1234", "5678", "abcd", "fghj"]
  var codesProcessed = 0 // keeps track of how many codes' we've async saved so far

  return new Promise((resolve, reject) => {
    // remove all codes currently in there, so we don't get errors
    Code.remove({}).then((result) => {
      // loop through codes
      codes.forEach((oneCode) => {
        var code = Code({ code: oneCode })
        code.save((err, res) => {
          if (err) { reject(err) }
          codesProcessed ++
          if (codesProcessed === codes.length) { resolve(codes) }
        })
      })
    })
  })
}

var createProject = function(project, authToken) {
  return new Promise((resolve, reject) => {
    Project.remove({}).then((results) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", authToken)
        .send({ project: project })
        .end((err, res) => {
          if (err) { reject(err) }
          else { resolve(res.body) }
        })
    })
  })
}

module.exports = {
  seedUsers: seedUsers,
  loginUser: loginUser,
  registerUser: registerUser,
  createReading: createReading,
  createCodes: createCodes,
  createProject: createProject
}