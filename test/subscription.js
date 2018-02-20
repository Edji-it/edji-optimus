let chai = require("chai")
let chaiHttp = require("chai-http")
let server = "http://localhost:3354"
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
let testSubEvents = [] // ANY TIME a test creates a subscription, it needs to be pushed in here. Also, I'm only ever using the teacher token here.

let deleteSubscription = function(subscriptionId, userToken) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .del("/subscriptions/" + subscriptionId)
      .set("Authorization", userToken)
      .end((err, res) => {
        if (err) { reject(err) }
        else { resolve(res) }
      })
  })
}

describe("Subscriptions", () => {

  before((done) => {
    functions.loginTestUsers().then((users) => {
      testUsers = users
      done()
    })
  })

  after((done) => {
    let promises = []
    // we need to clean up all of the subscriptions we created
    for(let i = 0; i < testSubEvents.length; i++) {
      promises.push(deleteSubscription(testSubEvents[i].subscription_id, testUsers.testTeacher.token))
    }

    Q.all(promises)
      .then((responses) => {
        done()
      })
      .catch((err) => {
        done(err)
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
          if (hero.will_expire) {
            hero.will_expire.should.be.equal(null)
          }
          hero.should.have.property("subscription_type")
            hero.subscription_type.should.be.equal("monthly")
          hero.should.have.property("subscription_label")
            hero.subscription_label.should.be.equal("PLAIN_HERO")
          hero.should.have.property("active")
            hero.active.should.be.equal(true)
          
          hero.should.have.property("history")
            hero.history.should.be.instanceOf(Array)
            hero.history.length.should.be.above(0)

          // assign update so that we can use it in later tests
          let update = hero.history[0]
          testSubEvents.push(update)
          update.should.have.property("subscription_id")
            update.subscription_id.should.be.equal(hero.subscription_id)
          update.should.have.property("subscription_type")
            update.subscription_type.should.be.equal("monthly")
          update.should.have.property("change")
            update.change.should.be.equal("subscribed")
          update.should.have.property("date")
            let histDate = new Date(update.date).valueOf()
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
          if (hero.will_expire) {
            hero.will_expire.should.be.equal(null)
          }
          hero.should.have.property("subscription_type")
            hero.subscription_type.should.be.equal("monthly")
          hero.should.have.property("subscription_label")
            hero.subscription_label.should.be.equal("TEST")

          hero.should.have.property("history")
            hero.history.should.be.instanceOf(Array)
            hero.history.length.should.be.above(0)
          
          testSubEvents.push(hero.history[0])

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

    // this test needs to be re-written after the subscriptions tests are refactored
    it("should accept a call without token", (done) => { // to allow users to sign up with a 100% off code
      chai.request(server)
        .post("/subscriptions")
        .send({
          subscriptionType: "monthly",
          couponCode: "TEST__2017"
        })
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(200)

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
      let eventToDelete = testSubEvents[0]

      chai.request(server)
        .del("/subscriptions/" + eventToDelete.subscription_id)
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property("user")
          res.body.user.should.have.property("hero")

          let hero = res.body.user.hero
          hero.should.have.property("subscription_id")
            hero.subscription_id.should.be.equal(eventToDelete.subscription_id)
          hero.should.have.property("will_expire")
          hero.should.have.property("subscription_type")
          hero.should.have.property("subscription_label")
          hero.should.have.property("active")
            hero.active.should.be.equal(true)

          hero.should.have.property("history")
            hero.history.should.be.instanceOf(Array)
            hero.history.length.should.be.above(0)

          let event = hero.history[0]
          event.should.have.property("subscription_id")
            event.subscription_id.should.be.equal(event.subscription_id)
          event.should.have.property("subscription_type")
          event.should.have.property("change")
            event.change.should.be.equal("unsubscribed")
          event.should.have.property("date")
            let histDate = new Date(event.date).valueOf()
            histDate.should.be.above(Date.now() - 1000 * 60)

          testSubEvents.splice(0,1) // remove this from the array of subscriptions that need to be deleted
          done()
        })
    })

    it("should reject an invalid subscription id", (done) => {
      chai.request(server)
        .del("/subscriptions/not_a_token")
        .set("Authorization", testUsers.testTeacher.token)
        .end((err, res) => {

          res.should.have.status(404)
          done()
        })
    })

    it("should return 404 if the subscription's owner attempts to delete it", (done) => {
      let eventToDelete = testSubEvents[0]

      chai.request(server)
        .del("/subscriptions/" + eventToDelete.subscription_id)
        .set("Authorization", testUsers.testStudent.token)
        .end((err, res) => {

          res.should.have.status(404)
          done()
        })
    })

    it("should reject a request without an Authorization token", (done) => {
      let eventToDelete = testSubEvents[0]

      chai.request(server)
        .del("/subscriptions/" + eventToDelete.subscription_id)
        .end((err, res) => {

          res.should.have.status(401)
          done()
        })
    })
  })
})