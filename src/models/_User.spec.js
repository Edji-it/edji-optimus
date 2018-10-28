// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const randomstring = require('randomstring')
const bcrypt = require('bcryptjs')

// project imports
const stripe = require('./../api/v1/stripe/_stripe').api
const _User = require('./_User')

describe('_User', () => {
  describe('getUserHeroStatus', () => {
    let retrieveSubscriptions

    beforeEach(() => {
      retrieveSubscriptions = sinon.stub(stripe.subscriptions, 'list').resolves({ data: [{}] }) // resolving with non-empty data array should me the user has active subscriptions
    })

    afterEach(() => {
      retrieveSubscriptions.restore()
    })

    it('should return return true if the customer has a license id', (done) => {
      _User.getUserHeroStatus({ license_ids: ['1234'] })
        .then((heroStatus) => {
          heroStatus.should.be.true
          sinon.assert.notCalled(retrieveSubscriptions)
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it('should return false if the user does not have license_ids or a stripe_customer_id', (done) => {
      _User.getUserHeroStatus({ license_ids: [] })
        .then((heroStatus) => {
          heroStatus.should.be.false
          sinon.assert.notCalled(retrieveSubscriptions)
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it('should return true and call stripe.subscriptions.list with the correct parameters', (done) => {
      let fakeUser = { stripe_customer_id: 'cus_123abc' }
      _User.getUserHeroStatus(fakeUser)
        .then((heroStatus) => {
          heroStatus.should.be.true
          sinon.assert.calledOnce(retrieveSubscriptions)

          // test what stripe was called with
          let callObj = retrieveSubscriptions.firstCall.args[0]
          callObj.should.have.property('customer')
          callObj.customer.should.be.equal(fakeUser.stripe_customer_id)
          callObj.should.have.property('plan')
          callObj.plan.should.be.equal('yearly')
          callObj.should.have.property('status')
          callObj.status.should.be.equal('active')

          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it('should return false if stripe returns no subscriptions', (done) => {
      // redefine the retrieveSubscriptions stub
      retrieveSubscriptions.restore()
      retrieveSubscriptions = sinon.stub(stripe.subscriptions, 'list').resolves({ data: [] })

      let fakeUser = { stripe_customer_id: 'cus_123abc' }
      _User.getUserHeroStatus(fakeUser)
        .then((heroStatus) => {
          heroStatus.should.be.false
          sinon.assert.calledOnce(retrieveSubscriptions)

          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe('createOneTimeTokenObject', () => {
    let randomToken = '12j4kl1j35kl4;2j5kl42' // the token which will be returned by the random string generator
    let mockHash = 'this is a fake return value'

    let generateStringStub
    let hashStub

    beforeEach(() => {
      generateStringStub = sinon.stub(randomstring, 'generate').returns(randomToken)
      hashStub = sinon.stub(bcrypt, 'hashSync').returns(mockHash)
    })

    afterEach(() => {
      generateStringStub.restore()
      hashStub.restore()
    })

    it('should make one call to generate a random string, and one call to bcrypt.hashSync', () => {
      let token = _User.createOneTimeTokenObject(false)
      sinon.assert.calledOnce(generateStringStub)
      sinon.assert.calledOnce(hashStub)
    })

    it('should return the result of bcrypt.hashSync', () => {
      let { tokenObj } = _User.createOneTimeTokenObject(false)
      tokenObj.token.should.be.equal(mockHash)
    })

    it('should return the unhashed token', () => {
      let { unhashedToken } = _User.createOneTimeTokenObject(false)
      unhashedToken.should.be.equal(randomToken)
    })

    it('should create tokens made up of hex characters', () => {
      let token = _User.createOneTimeTokenObject(false)
      let strOptions = generateStringStub.getCall(0).args[0]
      strOptions.charset.should.be.equal('hex')
    })

    it('should call bcrypt.hashSync with the random hex token as the first property', () => {
      let token = _User.createOneTimeTokenObject(false)
      hashStub.getCall(0).args[0].should.be.equal(randomToken)
    })

    it('should generate a tokenObj with an expiration 24 hrs from now', () => {
      let estimatedExpiration = Date.now() + 1000 * 3600 * 24
      let expirationMax = estimatedExpiration + 1000
      let expirationMin = estimatedExpiration - 1000
      let { tokenObj } = _User.createOneTimeTokenObject(false)
      let expiration = tokenObj.expiration
      let isValidExpiration = expiration && expiration < expirationMax && expiration > expirationMin
      isValidExpiration.should.be.true
    })

    it('should generate a jwt with a custom expiration', () => {
      let testedExpireTime = 48
      let estimatedExpiration = Date.now() + 1000 * 3600 * testedExpireTime
      let expirationMax = estimatedExpiration + 1000
      let expirationMin = estimatedExpiration - 1000
      let { tokenObj } = _User.createOneTimeTokenObject(testedExpireTime)
      let expiration = tokenObj.expiration
      let isValidExpiration = expiration && expiration < expirationMax && expiration > expirationMin
      isValidExpiration.should.be.true
    })
  })

  describe('validateToken', () => {
    let fakeTokenToVerify = 'jrieoqnfdjgauifnjecidanjf;da'
    let fakeTokenObj = {
      token: 'this is whatever',
      expiration: Date.now() + 1000 * 3600 // make the expiration later
    }
    let bcryptCompareStub

    beforeEach(() => {
      bcryptCompareStub = sinon.stub(bcrypt, 'compareSync')
    })

    afterEach(() => {
      bcryptCompareStub.restore()
    })

    it('should call bcrypt.compare once', () => {
      bcryptCompareStub.returns(true)
      let fakeUnhashedToken = 'this is a fake hash'

      let valid = _User.validateToken(fakeUnhashedToken, fakeTokenObj)

      valid.should.be.true
      sinon.assert.calledOnce(bcryptCompareStub)
      bcryptCompareStub.getCall(0).args[0].should.be.equal(fakeUnhashedToken)
      bcryptCompareStub.getCall(0).args[1].should.be.equal(fakeTokenObj.token)
    })

    it('should return false if the jwt is not valid', () => {
      bcryptCompareStub.returns(false)

      let valid = _User.validateToken('this is a fake hash', fakeTokenObj)

      valid.should.be.false
    })

    it('should return false for an expired token', () => {
      let mockTokenObj = {
        token: 'somestr',
        expiration: Date.now() - 1000 * 3600 // an expired date
      }
      let valid = _User.validateToken("this doesn't even matter!", mockTokenObj)

      valid.should.be.false
    })
  })

  describe('create and validate one time use token workflow', () => {
    let randomTokenStub
    let unhashedToken = '1234567890fjklso'
    beforeEach(() => {
      randomTokenStub = sinon.stub(randomstring, 'generate').returns(unhashedToken)
    })
    afterEach(() => {
      randomTokenStub.restore()
    })

    it('should create and validate a one time use token with default expiration', () => {
      let { unhashedToken, tokenObj } = _User.createOneTimeTokenObject(false)
      let valid = _User.validateToken(unhashedToken, tokenObj)
      valid.should.be.true
    })

    it('should create and validate a one time use token with custom expiration', () => {
      let { unhashedToken, tokenObj } = _User.createOneTimeTokenObject(1)
      let valid = _User.validateToken(unhashedToken, tokenObj)
      valid.should.be.true
    })
  })
})