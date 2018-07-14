// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const randomstring = require('randomstring')
const jwt = require('jsonwebtoken')

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

  describe('createOneTimeToken', () => {
    let randomToken = '12j4kl1j35kl4;2j5kl42' // the token which will be returned by the random string generator
    let mockJwt = 'this is a fake return value'

    let generateStringStub
    let signJwtStub
    
    beforeEach(() => {
      generateStringStub = sinon.stub(randomstring, 'generate').returns(randomToken)
      signJwtStub = sinon.stub(jwt, 'sign').returns(mockJwt)
    })

    afterEach(() => {
      generateStringStub.restore()
      signJwtStub.restore()
    })

    it('should generate a jwt from the randomly generated string with a default expiration of 24 hrs', () => {
      let token = _User.createOneTimeToken()

      sinon.assert.calledOnce(generateStringStub)
      sinon.assert.calledOnce(signJwtStub)
      token.should.be.equal(mockJwt)

      let jwtArgs = signJwtStub.getCall(0).args
      // the token property
      jwtArgs[0].should.be.equal(randomToken)
      // the options, including expiration
      jwtArgs[2].should.be.instanceOf(Object)
      jwtArgs[2].expiresIn.should.be.equal('24h')
    })

    it('should create tokens made up of hex characters', () => {
      let token = _User.createOneTimeToken()

      let strOptions = generateStringStub.getCall(0).args[0]
      strOptions.charset.should.be.equal('hex')
    })

    it('should generate a jwt with a custom expiration', () => {
      let timePeriod = '2 days'

      let token = _User.createOneTimeToken(timePeriod)

      signJwtStub.getCall(0).args[2].expiresIn.should.be.equal(timePeriod)
    })
  })
})