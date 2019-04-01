// package imports
const chai = require('chai')
const sinon = require('sinon')

// project imports
const helpers = require('./_password_recovery')
const emailService = require('../../../services/email').EmailService

// constants
process.env.CLIENT_URL = 'localhost:3354'

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

  describe('createResetLink', () => {
    it('should return a link that includes the client url as the hostname', () => {
      let link = helpers.createResetLink('sometoken')
      link.includes(process.env.CLIENT_URL).should.be.true
    })

    it('should return a link that uriencodes the token', () => {
      let token = 'fkdjaoin/123432!#@#%#&%^#$U^&^$@+=-08*'
      let link = helpers.createResetLink(token)

      let encodedToken = encodeURIComponent(token)
      link.includes(encodedToken).should.be.true
    })
  })

  describe('sendRecoveryEmail', () => {
    let emailServiceStub
    let createResetLinkStub
    let createResetLinkReturn = 'hoogadabookada'
    let user
    beforeEach(() => {
      emailServiceStub = sinon.stub(emailService, 'sendEmail').resolves()
      createResetLinkStub = sinon.stub(helpers, 'createResetLink').returns(createResetLinkReturn)
      user = {
        email: 'corbin@edji.it',
        fullname: 'Corbin rocks!',
        resetPasswordToken: '8q4h9t4rnauvdyfd^&^^%$%$#%%(dafsfdskfjlads;jdla;"', // this would be a crappy string to put in a url if it was not encoded
      }
    })
    afterEach(() => {
      emailServiceStub.restore()
      createResetLinkStub.restore()
    })

    it('should call sendEmail with the correct user properties', done => {
      helpers
        .sendRecoveryEmail(user)
        .then(() => {
          sinon.assert.calledOnce(emailServiceStub)

          let emailOptions = emailServiceStub.firstCall.args[0]
          emailOptions.email.should.be.equal(user.email)
          emailOptions.name.should.be.equal(user.fullname)
          emailOptions.should.have.property('subject')
          emailOptions.should.have.property('vars_object')
          emailOptions.vars_object.name.should.be.equal(user.fullname)
          emailOptions.vars_object.reset_link.should.be.equal(createResetLinkReturn)

          sinon.assert.calledOnce(createResetLinkStub)
          createResetLinkStub.firstCall.args[0].should.be.equal(user.resetPasswordToken)

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should call sendEmail with a valid email templace', done => {
      helpers
        .sendRecoveryEmail(user)
        .then(() => {
          emailServiceStub.firstCall.args[0].email_template.should.be.equal('recover-password')
          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })

  describe('userCanResetPass', () => {
    it('should return true for a user with a username and password', () => {
      let user = {
        username: 'a_username',
        password: 'a_pass',
      }
      helpers.userCanResetPass(user).should.be.true
    })

    it('should return false for a user without a username', () => {
      let user = {
        password: 'a_pass',
      }
      helpers.userCanResetPass(user).should.be.false
    })

    it('should return false for a user without a password', () => {
      let user = {
        username: 'a_username',
      }
      helpers.userCanResetPass(user).should.be.false
    })

    it('should return false if the user has neither a username nor a password', () => {
      let user = {}
      helpers.userCanResetPass(user).should.be.false
    })
  })
})
