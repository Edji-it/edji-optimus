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

describe("TempUsers", () => {
  describe("POST /tempusers", () => {
    it("it should create a temp user", (done) => {
      chai.request(server)
        .post("/tempusers")
        .send({ user: data.users.tempUser })
        .end((err, res) => {
          // initial validation
          res.should.have.status(201)
          res.body.should.have.property("user")
          res.body.should.have.property("token")

          // user validation
          var user = res.body.user
          user.should.have.property("_id")
          user.should.have.property("fullname")
          user.should.have.property("type")
          user.should.have.property("createdAt")
          user.should.have.property("updatedAt")

          //token validation
          var token = res.body.token
          token.should.be.a("string")
          token.should.not.equal("")

          done()
        })
    })

    it("it should reject a call without a user", (done) => {
      chai.request(server)
        .post("/tempusers")
        .send({ nothing: { wrong: "something" } })
        .end((err, res) => {
          // initial validation
          res.should.have.status(400)
          res.should.have.property("error")
          res.error.should.have.property("text")

          // error response validation
          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.be.a("object")

          text.validationErrors.should.have.property("user")
          text.validationErrors.user.should.be.a("string")
          text.validationErrors.user.should.equal("required")

          done()
        })
    })

    it("it should return 'required' errors for all missing fields that are required", (done) => {
      chai.request(server)
        .post("/tempusers")
        .send({ user: { nothing: "something" } })
        .end((err, res) => {
          // initial validation
          res.should.have.status(406)
          res.should.have.property("error")
          res.error.should.have.property("text")

          // error response validation
          var text = JSON.parse(res.error.text)
          text.should.have.property("validationErrors")
          text.validationErrors.should.be.a("object")

          text.validationErrors.should.have.property("fullname")
          text.validationErrors.fullname.should.be.a("string")
          text.validationErrors.fullname.should.equal("required")

          done()
        })
    })
  })
})