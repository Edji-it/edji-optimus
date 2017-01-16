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

var seedUsers = function() {
  // should really simplify this into an object
  var credentials = [] // will have teacher credentials at index 0, student credentials at index 1 and temp credentials at index 2

  return new Promise((resolve, reject) => {
    //removes all users in database
    User.remove({}).then((results) => {

      // creates user from user object and logs in with the passed credentials
      createAndLogin(data.users.testTeacher, data.users.testTeacherCreds)
        .then((body) => {
          // add the new credentials to the array
          credentials.push(body)
          createAndLogin(data.users.testUser, data.users.testUserCreds)
            .then((body) => {
              // add credentials to array and resolve
              credentials.push(body)
              createTempUser(data.users.tempUser).then((body) => {
                credentials.push(body)
                resolve(credentials)
              })
            })
        })
    })
    .catch((err) => { console.error(err) })
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

var createAndLogin = function(user, creds) {
  return new Promise((resolve, reject) => {
    // registers and logs in user
    registerUser(user)
      .then((user) => {
        loginUser(creds)
          .then((res) => {
            resolve(res.body)
          })
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

/**
 * Creates multiple projects and then gets those projects, which should in turn add the user's id to the correct array
 * @param project A project object
 * @param teacherToken A user token, returned by login, which references a user with isTeacher: true
 * @param studentTokens An array of tokens for which a project will be created, and the id for the token added to the reading
 */
var createProjects = function(project, teacherToken, studentTokens) {
  var projects = []
  var completed = 0

  return new Promise((resolve, reject) => {
    // remove all projects in db
    Project.remove({}).then((results) => {
      // cycle through all student tokens
      studentTokens.forEach((token) => {
        // create a project with the teacher's token
        chai.request(server)
          .post("/projects")
          .set("Authorization", teacherToken)
          .send({ project: project })
          .end((err, res) => {
            if (err) { reject(err) }
            else {
              // get that created project with the student token (adding it to the correct _ids array)
              var createdProject = res.body.project
              chai.request(server)
                .get("/projects/" + createdProject._id)
                .set("Authorization", token)
                .end((err, res) => {
                  if (err) { reject(err) }
                  else {
                    // once we've completed the same number of calls as items in studentTokens, resolve with array of projects
                    completed ++
                    projects.push(res.body.project)
                    if (completed === studentTokens.length) { resolve(projects) }
                  }
                })
            }
          })
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