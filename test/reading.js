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
    it("should create a new reading without version id", (done) => {
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
          reading.should.have.property("success")
          reading.success.should.be.equal(true)
          reading.should.not.have.property("owner_id")
          reading.should.not.have.property("title")
          reading.should.not.have.property("words")
          reading.should.not.have.property("html")
          reading.should.not.have.property("promoter_ids")
          reading.should.not.have.property("comments")
          reading.should.not.have.property("teacher_ids")
          reading.should.not.have.property("createdAt")
          reading.should.not.have.property("updatedAt")

          done()
        })
    })

    it("should create a new reading with version id", (done) => {
      let newReading = Object.assign({}, data.readings.newReading)
      newReading.version_id = "58f13da5bbbc066712ad017f"

      chai.request(server)
        .post("/readings")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("reading")
          
          // reading validation
          var reading = res.body.reading
          testReading = reading // stores reading for later tests
          reading.should.have.property("_id")
          reading.should.have.property("success")
          reading.success.should.be.equal(true)
          reading.should.not.have.property("owner_id")
          reading.should.not.have.property("title")
          reading.should.not.have.property("words")
          reading.should.not.have.property("html")
          reading.should.not.have.property("promoter_ids")
          reading.should.not.have.property("comments")
          reading.should.not.have.property("teacher_ids")
          reading.should.not.have.property("createdAt")
          reading.should.not.have.property("updatedAt")

          done()
        })
    })

    it("should reject a reading without required fields", (done) => {
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

    it("should reject a POST without a reading", (done) => {
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

    it("should reject an unauthorized user", (done) => {
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

  describe("GET /readings/feed", () => {
    it("should get a list of readings", (done) => {
      chai.request(server)
        .get("/readings/feed")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("readings")
          res.body.readings.should.be.instanceof(Array)

          // readings validation
          let readings = res.body.readings
          readings.length.should.be.above(1)
          readings.length.should.be.below(16)
          readings.forEach((reading) => {
            reading.should.have.property("_id")
            reading.should.have.property("owner_id")
            reading.should.have.property("title")
            reading.should.have.property("teacher_ids")
            reading.should.have.property("createdAt")
            reading.should.have.property("updatedAt")

            // things the reading should NOT have
            reading.should.not.have.property("words")
            reading.should.not.have.property("html")
          })
        })
    })
  })

  describe("GET /readings/versions/:version_id", () => {
    it("should return all of the readings for a version id", (done) => {
      chai.request(server)
        .get("/readings/versions/" + testReading.version_id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("readings")
          res.body.readings.should.be.instanceof(Array)

          // readings validation
          let readings = res.body.readings
          readings.forEach((reading) => {
            // things the reading SHOULD have
            reading.should.have.property("_id")
            reading.should.have.property("owner_id")
            reading.should.have.property("title")
            reading.should.have.property("teacher_ids")
            // reading.should.have.property("public") // not a required field
            // reading.should.have.property("source") // not a required field
            // reading.should.have.property("cover_img") // not a required field
            // reading.should.have.property("promoter_count") // not a required field
            reading.should.have.property("createdAt")
            reading.should.have.property("updatedAt")

            // things the reading should NOT have
            reading.should.not.have.property("words")
            reading.should.not.have.property("html")
          })

          done()
        })
    })

    it("should reject an invalid version id", (done) => {
      chai.request(server)
        .get("/readings/versions/hello")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)

          done()
        })
    })

    it("should receive 404 for a version_id that does not exist", (done) => {
      chai.request(server)
        .get("/readings/versions/" + testUsers.testTeacher.user._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(404)

          done()
        })
    })

    it("should receive 401 if there is not Authorization header", (done) => {
      chai.request(server)
        .get("/readings/versions/" + testReading.version_id)
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })

    it("should receive 401 for incorrect user's id", (done) => {
      chai.request(server)
        .get("/readings/versions/" + testReading.version_id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("GET /readings/all/projects", () => {
    it("should return all of a user's readings with all of their of projects", (done) => {
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
            // reading.should.have.property("promoter_count")
            reading.should.have.property("teacher_ids")
            // reading.should.have.property("public") // not a required field
            // reading.should.have.property("source") // not a required field
            // reading.should.have.property("cover_img") // not a required field
            reading.should.have.property("versionCount")
            reading.should.have.property("createdAt")
            reading.should.have.property("updatedAt")

            // things the reading should NOT have
            reading.should.not.have.property("words")
            reading.should.not.have.property("html")

            // project validation
            reading.should.have.property("projects")
            reading.projects.forEach((project) => {
              // things a project SHOULD have
              project.should.have.property("_id")
              project.should.have.property("teacher_id")
                project.teacher_id.should.be.equal(testUsers.testTeacher.user._id)
              project.should.have.property("comment_count")
              project.should.have.property("student_count")
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

    it("should reject an unauthorized user", (done) => {
      chai.request(server)
        .get("/readings/all/projects")
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("PUT /readings/:id", () => {
    it("should update a readings with acceptable properties", (done) => {
      chai.request(server)
        .put("/readings/" + testReading._id)
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("reading")

          let reading = res.body.reading
          reading.should.have.property("_id")
          reading.should.have.property("html")
          reading.should.have.property("title")
          reading.should.have.property("words")
          reading.should.have.property("public")
          reading.should.have.property("source")
          reading.should.have.property("cover_img")
          reading.should.have.property("tags")
          reading.should.have.property("draft")
          reading.should.have.property("createdAt")
          reading.should.have.property("updatedAt")

          done()
        })
    })

    it("should return 400 when there is not a reading", (done) => {
      chai.request(server)
        .put("/readings/" + testReading._id)
        .set("Authorization", testUsers.testTeacher.token)
        .send({ notReading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("should receive 400 when an invalid id is passed", (done) => {
      chai.request(server)
        .put("/readings/notanid")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("should return 404 for an id that does not exist", (done) => {
      chai.request(server)
        .put("/readings/57bf5b422af8bc9a5a0fbae1")
        .set("Authorization", testUsers.testTeacher.token)
        .send({ reading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(404)

          done()
        })
    })

    it("should reject a request with a token which is not the user's", (done) => {
      chai.request(server)
        .put("/readings/" + testReading._id)
        .set("Authorization", testUsers.testStudent.token)
        .send({ reading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(401)

          done()
        })
    })

    it("should reject a request that does not have an auth token", (done) => {
      chai.request(server)
        .put("/readings/" + testReading._id)
        .send({ reading: data.readings.updateReading })
        .end((err, res) => {
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("DELETE /readings/:id", () => {
    let deleteProject
    before((done) => {
      // create a project associated with the reading, which we will later check is deleted
      functions.createProject({
          reading_id: testReading._id,
          label: "label for project",
          types: ["emoji"]
        }, testUsers.testTeacher.token)
        .then((res) => {
          // check to make sure it comes back with a project
          res.should.have.property("project")
          deleteProject = res.project
          done()
        })
        .catch((err) => { console.error(err) })
    })

    it("should receive 400 for improper id", (done) => {
      chai.request(server)
        .del("/readings/bad_id")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("should receive 404 if the reading does not exist", (done) => {
      chai.request(server)
        .del("/readings/" + testUsers.testTeacher.user._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(404)

          done()
        })
    })

    it("should return 404 if non-owner requests delete of the reading", (done) => {
      chai.request(server)
        .del("/readings/" + testReading._id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {
          res.should.have.status(404)

          done()
        })
    })

    it("should reject an unauthorized user", (done) => {
      chai.request(server)
        .del("/readings/" + testReading._id)
        .end((err, res) => {
          res.should.have.status(401)

          done()
        })
    })

    // this test should come LAST (except for the ones verifying other effects) since all of the other tests depend on the reading still existing
    it("should delete a reading", (done) => {
      // delete the reading
      chai.request(server)
        .del("/readings/" + testReading._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("results")
          
          let results = res.body.results
          results.should.have.property("deletedReadings")
            results.deletedReadings.should.be.gt(0)
          results.should.have.property("deletedProjects")
            results.deletedProjects.should.be.gt(0)

          done()
        })
    })

    // check that the deleted reading cannot be found
    it("should get a 404 when requesting the deleted reading's id", (done) => {
      // check to make sure it is deleted
      chai.request(server)
        .get("/readings/" + testReading._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(404)

          done()
        })
    })

    // check that the delete reading call also deleted associated projects
    it("should get a 404 when requesting a project associated with the deleted reading", (done) => {
      // check to make sure associated project is also deleted
      chai.request(server)
        .get("/projects/" + deleteProject._id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(404)

          done()
        })
    })
  })
})