var chai = require("chai")
var chaiHttp = require("chai-http")
var server = require("./../index")
var should = chai.should()
var Q = require("q")

var User = require("./../models/User")
var data = require("./data")
var functions = require("./functions")

chai.use(chaiHttp)

var testUserToken

describe("Readings", () => {
  beforeEach((done) => {
    // erases all user data, logs in a user and resolves with user's token
    functions.seedDB().then((token) => {
      testUserToken = token
      done()
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
})