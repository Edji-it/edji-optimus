// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

describe('GET /api/v1/licenses/', () => {
  // should get a 200 response from the server which means we got all licenses for that user
  it('should GET all licenses for the test user', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL + '')
    .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
    .end((err, res) => {
      should.not.exist(err)

      res.should.not.have.status(404)
      res.should.not.have.status(500)
      res.should.have.status(200)
      done()
    })
  })

  // should get a 404 response from the server which means we could not find any licenses for that user
  it('should get an error when attempting to GET all licenses for the test user', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL + '')
    .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
    .end((err, res) => {
      should.exist(err)

      res.should.not.have.status(200)
      res.should.have.status(404)
      done()
    })
  })
})