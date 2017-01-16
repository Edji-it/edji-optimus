var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
var should = chai.should()
var Q = require("q")

var User = require("./../models/User")
var data = require("./data")
var functions = require("./functions")

chai.use(chaiHttp)

// variables stored for use in tests
var testUserToken
var testUser
var testReading
var testProject

describe("Readings", () => {
  beforeEach((done) => {
    // erases all user data, logs in a user and resolves with user's token
    functions.seedUsers().then((res) => {
      testUserToken = res.token
      testUser = res.user

      // creates a reading for the created user
      functions.createReading(data.readings.newReading, testUserToken)
        .then((res) => {
          testReading = res.reading

          functions.createCode().then((codes) => { done() })
        })
    })
    .catch((err) => {
      console.error(err)
    })
  })

  describe("POST /projects", () => {
    it("it should create a new project", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUserToken)
        .send({ project: data.projects.getNewProject(testReading._id) })
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.property("project")
          done()
        })
    })
  })
})