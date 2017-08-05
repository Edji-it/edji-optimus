let chai = require("chai")
let chaiHttp = require("chai-http")
let config = require("config")
let server = config.get("Testing.url")
let should = chai.should()
let Q = require("q")

let User = require("./../models/User")
let data = require("./data")
let functions = require("./functions")

chai.use(chaiHttp)

// variables stored for use in tests
let testProject
let testUsers // comes with testStudent, testTeacher and testTemp
let testComments = {}
let testSubEvent

describe("Subscriptions", () => {

  before((done) => {
    functions.loginTestUsers().then((users) => {
      testUsers = users
      done()
    })
  })

  describe("POST /subscriptions", () => {
    it("should subscribe a user", (done) => {
      chai.request(server)
        .post("/subscriptions")
        .send({
          token: "tok_visa",
          subscriptionType: "monthly"
        })
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("user")
          res.body.user.should.have.property("hero")

          let hero = res.body.user.hero
          hero.should.have.property("subscription_id")
          hero.should.not.have.property("will_expire")
          hero.should.have.property("subscription_type")
            hero.subscription_type.should.be.equal("monthly")
          hero.should.have.property("subscription_label")
            hero.subscription_label.should.be.equal("PLAIN_HERO")
          hero.should.have.property("active")
            hero.active.should.be.equal(true)
          
          hero.should.have.property("history")
            hero.history.should.be.instanceOf(Array)
            hero.history.length.should.be.above(0)

          // assign testSubEvent so that we can use it in later tests
          testSubEvent = hero.history[0]
          testSubEvent.should.have.property("subscription_id")
            testSubEvent.subscription_id.should.be.equal(hero.subscription_id)
          testSubEvent.should.have.property("subscription_type")
            testSubEvent.subscription_type.should.be.equal("monthly")
          testSubEvent.should.have.property("change")
            testSubEvent.change.should.be.equal("subscribed")
          testSubEvent.should.have.property("date")
            let histDate = new Date(testSubEvent.date).valueOf()
            histDate.should.be.above(Date.now() - 1000 * 60)

          done()
        })
    })
    
    it("should register a user with a coupon code", (done) => {
      chai.request(server)
        .post("/subscriptions")
        .send({
          token: "tok_visa",
          subscriptionType: "monthly",
          couponCode: "TEST__2017"
        })
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          if (err) {
            return done(err)
          }

          // initial validation
          res.should.have.status(200)
          res.body.should.have.property("user")
          res.body.user.should.have.property("hero")

          let hero = res.body.user.hero
          hero.should.have.property("subscription_id")
          hero.should.not.have.property("will_expire")
          hero.should.have.property("subscription_type")
            hero.subscription_type.should.be.equal("monthly")
          hero.should.have.property("subscription_label")
            hero.subscription_label.should.be.equal("TEST")

          done()
        })
    })
    
    it("should reject a call without subscriptionType", (done) => {
      chai.request(server)
        .post("/subscriptions")
        .send({
          token: "tok_visa",
          couponCode: "TEST__2017"
        })
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("should reject a call without token", (done) => {
      chai.request(server)
        .post("/subscriptions")
        .send({
          subscriptionType: "monthly",
          couponCode: "TEST__2017"
        })
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(400)

          done()
        })
    })

    it("should not allow a user without an auth token", (done) => {
      chai.request(server)
        .post("/subscriptions")
        .send({
          token: "tok_visa",
          subscriptionType: "monthly",
          couponCode: "TEST__2017"
        })
        .end((err, res) => {
          // initial validation
          res.should.have.status(401)

          done()
        })
    })
  })

  describe("DELETE /subscriptions/:id", () => {
    it("should delete a user's subscription", (done) => {
      chai.request(server)
        .del("/subscriptions/" + testSubEvent.subscription_id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {

          res.should.have.status(200)
          res.body.should.have.property("user")
          res.body.user.should.have.property("hero")

          let hero = res.body.user.hero
          hero.should.have.property("subscription_id")
            hero.subscription_id.should.be.equal(testSubEvent.subscription_id)
          hero.should.have.property("will_expire")
          hero.should.have.property("subscription_type")
          hero.should.have.property("subscription_label")
          hero.should.have.property("active")
            hero.active.should.be.equal(true)

          hero.should.have.property("history")
            hero.history.should.be.instanceOf(Array)
            hero.history.length.should.be.above(0)

          let event = hero.history[0]
          testSubEvent.should.have.property("subscription_id")
            testSubEvent.subscription_id.should.be.equal(testSubEvent.subscription_id)
          testSubEvent.should.have.property("subscription_type")
          testSubEvent.should.have.property("change")
            testSubEvent.change.should.be.equal("unsubscribed")
          testSubEvent.should.have.property("date")
            let histDate = new Date(testSubEvent.date).valueOf()
            histDate.should.be.above(Date.now() - 1000 * 60)

          done()
        })
    })
  })
})