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
          done()
        })
      
    })
    .catch((err) => {
      console.error(err)
    })
  })

  describe("POST /readings", () => {
    it("it should create a new reading", (done) => {
      chai.request(server)
        .post("/readings")
        .set("Authorization", testUserToken)
        .send({ reading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("reading")
          
          // reading validation
          var reading = res.body.reading
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
        .set("Authorization", testUserToken)
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
        .set("Authorization", testUserToken)
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

    it("it should reject if there is no user", (done) => {
      chai.request(server)
        .post("/readings")
        .send({ notReading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)
          res.should.have.property("error")
          res.error.should.have.property("text")

          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.have.property("user")
          text.validationErrors.user.should.equal("required")

          done()
        })
    })
  })

  describe("GET /readings", () => {
    it("should get all of a users's readings", (done) => {
      chai.request(server)
        .get("/readings")
        .set("Authorization", testUserToken)
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
            reading.owner_id.should.equal(testUser._id)
          reading.should.have.property("title")
          reading.should.have.property("promoter_ids")
          reading.should.have.property("teacher_ids")
            reading.teacher_ids.indexOf(testUser._id).should.be.above(-1)
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

  // describe("GET /readings/:readingId/projects/:userId", () => {
  //   it("it should return all of a user's projects for a reading")
  // })
})