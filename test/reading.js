var chai = require("chai")
var chaiHttp = require("chai-http")
var config = require("config")
var server = config.get("Testing.url")
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
var testUsers
var testProject

describe("Readings", () => {

  before((done) => {
    // get test users from database
    functions.loginTestUsers().then((users) => {
      testUsers = users

      // create several projects for a teacher
      var makeProject = functions.createProject(data.projects.newProject, testUsers.testTeacher.token)
      var createProjects = []
      createProjects.push(makeProject)
      createProjects.push(makeProject)
      createProjects.push(makeProject)

      Q.all(createProjects)
        .done((result) => { done() })
    })
  })

  describe("POST /readings", () => {
    it("it should create a new reading", (done) => {
      chai.request(server)
        .post("/readings")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("reading")
          
          // reading validation
          var reading = res.body.reading
          testReading = reading // stores reading for later tests
          reading.should.have.property("_id")
          reading.should.have.property("owner_id")
          reading.should.have.property("title")
          reading.should.have.property("words")
          reading.should.have.property("html")
          reading.should.have.property("promoter_ids")
          reading.should.have.property("comments")
          reading.should.have.property("teacher_ids")
          reading.should.have.property("createdAt")
          reading.should.have.property("updatedAt")

          done()
        })
    })

    it("it should reject a reading without required fields", (done) => {
      chai.request(server)
        .post("/readings")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: { dumb: "this is not real data" } })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("title")
          text.validationErrors.title.should.equal("required")

          text.validationErrors.should.have.property("html")
          text.validationErrors.html.should.equal("required")

          text.validationErrors.should.have.property("words")
          text.validationErrors.words.should.equal("required")

          done()
        })
    })

    it("it should reject a POST without a reading", (done) => {
      chai.request(server)
        .post("/readings")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ notReading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("reading")
          text.validationErrors.reading.should.equal("required")

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .post("/readings")
        .send({ notReading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("GET /readings", () => {
    it("it should get all of a users's readings", (done) => {
      chai.request(server)
        .get("/readings")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("readings")
          var readings = res.body.readings
          readings.should.be.instanceof(Array)
          readings.length.should.be.above(0)

          // reading validation - properties it should have
          var reading = readings[0]
          reading.should.have.property("_id")
          reading.should.have.property("owner_id")
            reading.owner_id.should.equal(testUsers.testTeacher.user._id)
          reading.should.have.property("title")
          reading.should.have.property("promoter_ids")
          reading.should.have.property("teacher_ids")
            reading.teacher_ids.indexOf(testUsers.testTeacher.user._id).should.be.above(-1)
          reading.should.have.property("createdAt")
          reading.should.have.property("updatedAt")
          // reading validation - properties it should NOT have
          reading.should.not.have.property("words")
          reading.should.not.have.property("html")
          reading.should.not.have.property("comments")

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .get("/readings")
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("GET /readings/projects", () => {
    it("it should return all of a user's readings with all of their of projects", (done) => {
      chai.request(server)
        .get("/readings/all/projects")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("readings")
          res.body.readings.should.be.instanceof(Array)

          // readings validation
          var readings = res.body.readings
          readings.forEach((reading) => {
            // things the reading SHOULD have
            reading.should.have.property("_id")
            reading.should.have.property("owner_id")
            reading.should.have.property("title")
            reading.should.have.property("promoter_count")
            reading.should.have.property("keeper_ids")
            reading.should.have.property("public")
            reading.should.have.property("source")
            reading.should.have.property("cover_img")
            reading.should.have.property("createdAt")
            reading.should.have.property("updatedAt")

            // things the reading should NOT have
            reading.should.not.have.property("words")
            reading.should.not.have.property("html")
            reading.should.not.have.property("comments")

            // project validation
            reading.should.have.property("projects")
            reading.projects.forEach((project) => {
              // things a project SHOULD have
              project.should.have.property("_id")
              project.should.have.property("teacher_id")
              project.should.have.property("comment_count")
              project.should.have.property("students_count")
              project.should.have.property("label")
              project.should.have.property("code")
              project.should.have.property("types")
              project.should.have.property("createdAt")
              project.should.have.property("updatedAt")

              // things a project should NOT have
              project.should.not.have.property("comments")
              project.should.not.have.property("students_ids")
              project.should.not.have.property("temp_ids")
            })
          })

          done()
        })
    })

    it("it should reject an unauthorized user", (done) => {
      chai.request(server)
        .get("/readings/projects")
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })
})