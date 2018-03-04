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

  it('should get a 400 when requesting with a bad query parameter', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL + "?badparam=nothing")
    .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
    .end((err, res) => {
      should.exist(err)

      res.should.not.have.status(200)
      res.should.have.status(400)
      done()
    })
  })

  let DEFAULT_READINGS_LIST

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
      DEFAULT_READINGS_LIST = readings

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

  it('should return 20 readings with ?size=20 query parameter', (done) => {
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

  it('should start at the next index with ?start=1 query parameter', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL + '?start=1')
    .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
    .end((err, res) => {
      if (err) { return done(err) }

      res.should.have.status(200)
      res.body.should.have.property('readings')

      // tests if we've incremented 1 reading forward in the list
      res.body.readings[0]._id.should.be.equal(DEFAULT_READINGS_LIST[1]._id)
      res.body.readings[0]._id.should.not.be.equal(DEFAULT_READINGS_LIST[0]._id) // negative test

      done()
    })
  })
})