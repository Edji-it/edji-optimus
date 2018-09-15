// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// constants
const SUCCESS_USER = {
  username: 'api_email_success',
  email: 'success@simulator.amazonses.com'
}

describe('GET /api/v1/users/password_recovery', () => {
  it('should receive a successful response for a username that exists', (done) => {
    chai.request(TEST.SERVER)
      .put('/api/v1/users/recover_password')
      .send({
        username: SUCCESS_USER.username
      })
      .end((err, res) => {
        err && done(err)

        res.should.have.status(204)
        done()
      })
  })

  // it('should receive a successful response for an email that exists', (done) => {
  //   chai.request(TEST.SERVER)
  //     .put('/api/v1/users/recover_password')
  //     .send({
  //       email: SUCCESS_USER.email
  //     })
  //     .end((err, res) => {
  //       err && done(err)

  //       res.should.have.status(204)
  //       done()
  //     })
  // })

  // it('should receive a 404 for a username that does not exist', (done) => {
  //   chai.request(TEST.SERVER)
  //     .put('/api/v1/users/recover_password')
  //     .send({
  //       username: 'idk_if_this_exists_but_it_probably_doesnt'
  //     })
  //     .end((err, res) => {
  //       should.exist(err)

  //       res.should.have.status(404)
  //       done()
  //     })
  // })

  // it('should receive a 404 for an email that does not exist', (done) => {
  //   chai.request(TEST.SERVER)
  //     .put('/api/v1/users/recover_password')
  //     .send({
  //       email: 'idk_if_this_exists_but_it_probably_doesnt'
  //     })
  //     .end((err, res) => {
  //       should.exist(err)

  //       res.should.have.status(404)
  //       done()
  //     })
  // })

  // it('should receive a 400 if the request does not contain a username or email', (done) => {
  //   chai.request(TEST.SERVER)
  //     .put('/api/v1/users/recover_password')
  //     // .send({
  //     //   not_a_username: 'idk_if_this_exists_but_it_probably_doesnt'
  //     // })
  //     .end((err, res) => {
  //       should.exist(err)

  //       res.should.have.status(400)
  //       done()
  //     })
  // })
})