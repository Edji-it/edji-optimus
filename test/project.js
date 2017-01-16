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
var testUser, testUserToken
var testTeacher, testTeacherToken
var testReading
var testProject

describe("Projects", () => {
  beforeEach((done) => {
    // erases all user data, logs in a user and resolves with user's token
    functions.seedUsers().then((credentialsArr) => {
      testTeacher = credentialsArr[0].user
      testTeacherToken = credentialsArr[0].token

      testUserToken = credentialsArr[1].token
      testUser = credentialsArr[1].user

      // creates a reading for the created user
      functions.createReading(data.readings.newReading, testTeacherToken)
        .then((body) => {
          testReading = body.reading
          // seeds the database with lightning codes, which the project will take before saving
          functions.createCodes().then((codes) => {
            // clears all projects in the database, then creates a new one and saves as testProject
            functions.createProject(data.projects.getNewProject(testReading._id), testTeacherToken)
              .then((body) => {
                testProject = body.project
                done()
              })
          })
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
        .set("Authorization", testTeacherToken)
        .send({ project: data.projects.getNewProject(testReading._id) })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("project")

          // project validation
          var project = res.body.project
          project.should.have.property("_id")
          project.should.have.property("teacher_id")
            project.teacher_id.should.equal(testTeacher._id)
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
        .set("Authorization", testTeacherToken)
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
        .set("Authorization", testTeacherToken)
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

    it("it should catch invalid types in `types` array", (done) => {
      chai.request(server)
        .post("/projects")
        .set("Authorization", testTeacherToken)
        .send({ project: data.projects.getInvalidTypesProject(testReading._id) })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("types.0")
          text.validationErrors["types.0"].should.equal("enum")

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

  describe("GET /projects/:id", () => {
    it("should get a project for a teacher", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .set("Authorization", testTeacherToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("project")

          // students_ids validation
          var project = res.body.project
          project.should.have.property("students_ids")
          var students_ids = project.students_ids
          
          students_ids.should.be.instanceof(Array)
          students_ids.forEach((stuObj) => {
            stuObj.should.have.property("_id")
              stuObj._id.should.not.equal(testTeacher._id)
            stuObj.should.have.property("fullname")
          })

          done()
        })
    })

    it("should get a project for a student", (done) => {
      chai.request(server)
        .get("/projects/" + testProject._id)
        .set("Authorization", testUserToken)
        .end((err, res) => {
          res.should.have.status(200)
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

          // students_ids validation
          var studentExists = false
          var students_ids = project.students_ids
          students_ids.should.be.instanceof(Array)
          students_ids.forEach((stuObj) => {
            stuObj.should.have.property("_id")
            stuObj.should.have.property("fullname")
            if (stuObj._id === testUser._id) { studentExists = true }
          })
          studentExists.should.equal(true)

          done()
        })
    })
  })
})