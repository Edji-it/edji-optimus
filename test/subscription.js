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
            done(err)
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
            done()
        })
    })
  })
})