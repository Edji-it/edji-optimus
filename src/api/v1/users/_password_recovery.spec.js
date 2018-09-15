// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')

// project imports
const helpers = require('./_password_recovery')

describe('_password_recovery', () => {
  describe('createQuery', () => {
    it('should create a valid query for username', () => {
      let username = 'corbin'
      let query = helpers.createQuery({ username: username })

      query.should.have.property('username')
      query.username.should.be.equal(username)
      query.should.not.have.property('email')
    })

    it('should create a valid query for email', () => {
      let email = 'corbin@edji.it'
      let query = helpers.createQuery({ email: email })

      query.should.have.property('email')
      query.email.should.be.equal(email)
      query.should.not.have.property('username')
    })

    it('should return undefined if username or email are not passed in', () => {
      let brokenQuery = { notValid: 'this is not valid' }
      let query = helpers.createQuery(brokenQuery)

      for (let property in query) {
        should.not.exist(property)
      }
    })
  })
})