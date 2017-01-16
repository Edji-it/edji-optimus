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

          functions.createCodes().then((codes) => { done() })
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
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("project")

          // project validation
          var project = res.body.project
          project.should.have.property("_id")
          project.should.have.property("teacher_id")
          project.should.have.property("reading_id")
          project.should.have.property("label")
          project.should.have.property("code")
          project.should.have.property("types")
          project.should.have.property("temp_ids")
          project.should.have.property("students_ids")
          project.should.have.property("comments")
          project.should.have.property("updatedAt")
          project.should.have.property("createdAt")

          done()
        })
    })

    it("it should reject a request without a project", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUserToken)
        .send({ nothing: data.projects.getNewProject(testReading._id) })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("project")
          text.validationErrors.project.should.equal("required")

          done()
        })
    })

    it("it should return 'required' errors for all missing fields that are required", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testUserToken)
        .send({ project: {missing: "everything"} })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("label")
          text.validationErrors.label.should.equal("required")

          text.validationErrors.should.have.property("reading_id")
          text.validationErrors.reading_id.should.equal("required")

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .post("/projects")
        .send({ project: data.projects.getNewProject(testReading._id) })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })
})