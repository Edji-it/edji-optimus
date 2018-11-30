// library import
const chai = require("chai")
chai.use(require("chai-http"))

// project imports
const TEST = require('../../../test/constants')

// constants
const SUCCESS_USER = {
  username: 'api_email_success',
  email: 'success@simulator.amazonses.com'
}
const ENDPOINT_URL = '/api/v1/users/password_recovery'

describe('PUT /api/v1/users/password_recovery', () => {
  it('should receive a successful response for a username that exists', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      .send({
        username: SUCCESS_USER.username
      })
      .end((err, res) => {
        err && done(err)

        res.should.have.status(204)
        done()
      })
  })

  it('should receive a successful response for an email that exists', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      .send({
        email: SUCCESS_USER.email
      })
      .end((err, res) => {
        err && done(err)

        res.should.have.status(204)
        done()
      })
  })

  it('should receive a 400 for a user that exists, but has only signed in with oauth', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      .send({
        email: TEST.LOGIN_INFO.GOOGLE_OAUTH_USER.email
      })
      .end((err, res) => {
        res.should.have.status(400)

        res.body.should.have.property('error')
        res.body.error.should.be.equal('NO_LOGIN_CREDENTIALS')
        res.body.should.have.property('message')
        res.body.should.have.property('oauth_types')
        res.body.oauth_types.should.be.instanceOf(Array)
        res.body.oauth_types.includes('google').should.be.true

        done()
      })
  })

  it('should receive a 404 for a username that does not exist', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      .send({
        username: 'idk_if_this_exists_but_it_probably_doesnt'
      })
      .end((err, res) => {
        res.should.have.status(404)
        done()
      })
  })

  it('should receive a 404 for an email that does not exist', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      .send({
        email: 'idk_if_this_exists_but_it_probably_doesnt'
      })
      .end((err, res) => {
        res.should.have.status(404)
        done()
      })
  })

  it('should receive a 400 if the request does not contain a username or email', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL)
      // .send({
      //   not_a_username: 'idk_if_this_exists_but_it_probably_doesnt'
      // })
      .end((err, res) => {
        res.should.have.status(400)
        done()
      })
  })
})