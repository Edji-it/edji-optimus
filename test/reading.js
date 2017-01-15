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
        .send({reading: data.readings.newReading })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("reading")

          done()
        })
    })
  })
})