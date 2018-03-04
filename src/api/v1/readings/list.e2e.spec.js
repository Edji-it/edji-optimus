// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/readings'

describe('GET /readings', () => {
  it('should get a 401 without auth', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL)
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(401)
        done()
      })
  })

  // this test also serves as validation for all of the properties of readings
  it('should return a list of 15 readings with default properties', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL)
    .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
    .end((err, res) => {
      if (err) { return done(err) }
      res.should.have.status(200)

      // total property test
      res.body.should.have.property('total')
      res.body.total.should.be.above(0)

      // readings tests
      res.body.should.have.property('readings')
      const readings = res.body.readings
      readings.should.be.instanceOf(Array)
      readings.length.should.be.equal(15)

      readings.forEach((reading) => {
        // things the reading SHOULD have
        reading.should.have.property("_id")
        reading.should.have.property("owner_id")
        reading.should.have.property("title")
        reading.should.have.property("teacher_ids")
        reading.should.have.property("versionCount")
        reading.should.have.property("createdAt")
        reading.should.have.property("updatedAt")

        // things the reading should NOT have
        reading.should.not.have.property("words")
        reading.should.not.have.property("html")
      })

      done()
    })
  })

  describe('?size parameter', () => {
    it('should return 20 readings', (done) => {
      chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '?size=20')
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        if (err) { return done(err) }

        res.should.have.status(200)
        res.body.should.have.property('readings')
        res.body.readings.length.should.be.equal(20)

        done()
      })
    })
  })
})