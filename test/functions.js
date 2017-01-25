var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")

chai.use(chaiHttp)

var Q = require("q")

var User = require("./../models/User")
var Code = require("./../models/SessionCode")
var Project = require("./../models/Project")
var TempUser = require("./../models/TempUser")
var data = require("./data")

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

// should be made more robust once testing tempuser routes
var createTempUser = function(user) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post("/tempusers")
      .send({ user: data.users.tempUser })
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res.body) }
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

var createProject = function(project, authToken) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post("/projects")
      .set("Authorization", authToken)
      .send({ project: project })
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res.body) }
      })
  })
}

// returns object with login credentials for all users
var loginTestUsers = function() {
  return new Promise((resolve, reject) => {
    var promises = [
      loginUser(data.users.testStudentCreds),
      loginUser(data.users.testTeacherCreds),
      createTempUser(data.users.tempUser)
    ]
    Q.all(promises).done((results) => {
      var testUsers = {
        testStudent: results[0].body,
        testTeacher: results[1].body,
        testTemp: results[2]
      }
      resolve(testUsers)
    })
  })
}

module.exports = {
  createReading: createReading,
  createProject: createProject,
  loginTestUsers: loginTestUsers
}