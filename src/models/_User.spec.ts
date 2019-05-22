// library imports
import { expect } from 'chai'
import { stub, assert, SinonStub } from 'sinon'
import randomstring = require('randomstring')
import bcrypt = require('bcryptjs')

// project imports
import * as stripe from './../api/v1/stripe/_stripe'
import { getUserHeroStatus, validateToken, createOneTimeTokenObject, generateOAuthObject } from './_User'

describe('_User', () => {
  describe('getUserHeroStatus', () => {
    let heroSubStub: SinonStub
    beforeEach(() => {
      heroSubStub = stub(stripe, 'getHeroSubscriptions').resolves([{}]) // resolving with non-empty data array should me the user has active subscriptions
    })
    afterEach(() => {
      heroSubStub.restore()
    })

    it('should return return true if the customer has a license id', async () => {
      const heroStatus = await getUserHeroStatus({ license_ids: ['1234'] })
      expect(heroStatus).to.be.true
      assert.notCalled(heroSubStub)
    })

    it('should return false if the user does not have license_ids or a stripe_customer_id', async () => {
      const heroStatus = await getUserHeroStatus({ license_ids: [] })
      expect(heroStatus).to.be.false
      assert.notCalled(heroSubStub)
    })

    it('should return true if the user has an active subscription from stripe', async () => {
      let fakeUser = { stripe_customer_id: 'cus_123abc' }

      const heroStatus = await getUserHeroStatus(fakeUser)
      expect(heroStatus).to.be.true
      assert.calledOnce(heroSubStub)
      const [customerId, status] = heroSubStub.firstCall.args
      expect(customerId).to.be.equal(fakeUser.stripe_customer_id)
      expect(status).to.be.equal('active')
    })

    it('should return false if stripe returns no subscriptions', async () => {
      heroSubStub.resetBehavior()
      heroSubStub.resolves({ data: [] })

      const fakeUser = { stripe_customer_id: 'cus_123abc' }
      const heroStatus = await getUserHeroStatus(fakeUser)
      heroStatus.should.be.false
      assert.calledOnce(heroSubStub)
    })
  })

  describe('createOneTimeTokenObject', () => {
    let randomToken = '12j4kl1j35kl4;2j5kl42' // the token which will be returned by the random string generator
    let mockHash = 'this is a fake return value'
    let generateStringStub: SinonStub
    let hashStub: SinonStub

    beforeEach(() => {
      generateStringStub = stub(randomstring, 'generate').returns(randomToken)
      hashStub = stub(bcrypt, 'hashSync').returns(mockHash)
    })
    afterEach(() => {
      generateStringStub.restore()
      hashStub.restore()
    })

    it('should make one call to generate a random string, and one call to hashSync', () => {
      let token = createOneTimeTokenObject(false)
      assert.calledOnce(generateStringStub)
      assert.calledOnce(hashStub)
    })

    it('should return the result of hashSync', () => {
      let { tokenObj } = createOneTimeTokenObject(false)
      tokenObj.token.should.be.equal(mockHash)
    })

    it('should return the unhashed token', () => {
      let { unhashedToken } = createOneTimeTokenObject(false)
      unhashedToken.should.be.equal(randomToken)
    })

    it('should create tokens made up of hex characters', () => {
      let token = createOneTimeTokenObject(false)
      let strOptions = generateStringStub.getCall(0).args[0]
      strOptions.charset.should.be.equal('hex')
    })

    it('should call hashSync with the random hex token as the first property', () => {
      let token = createOneTimeTokenObject(false)
      hashStub.getCall(0).args[0].should.be.equal(randomToken)
    })

    it('should generate a tokenObj with an expiration 24 hrs from now', () => {
      let estimatedExpiration = Date.now() + 1000 * 3600 * 24
      let expirationMax = estimatedExpiration + 1000
      let expirationMin = estimatedExpiration - 1000
      let { tokenObj } = createOneTimeTokenObject(false)
      let expiration = tokenObj.expiration
      let isValidExpiration = expiration && expiration < expirationMax && expiration > expirationMin
      isValidExpiration.should.be.true
    })

    it('should generate a jwt with a custom expiration', () => {
      let testedExpireTime = 48
      let estimatedExpiration = Date.now() + 1000 * 3600 * testedExpireTime
      let expirationMax = estimatedExpiration + 1000
      let expirationMin = estimatedExpiration - 1000
      let { tokenObj } = createOneTimeTokenObject(testedExpireTime)
      let expiration = tokenObj.expiration
      let isValidExpiration = expiration && expiration < expirationMax && expiration > expirationMin
      isValidExpiration.should.be.true
    })
  })

  describe('validateToken', () => {
    let fakeTokenToVerify = 'jrieoqnfdjgauifnjecidanjf;da'
    let fakeTokenObj = {
      token: 'this is whatever',
      expiration: Date.now() + 1000 * 3600, // make the expiration later
    }
    let bcryptCompareStub

    beforeEach(() => {
      bcryptCompareStub = stub(bcrypt, 'compareSync')
    })

    afterEach(() => {
      bcryptCompareStub.restore()
    })

    it('should call compare once', () => {
      bcryptCompareStub.returns(true)
      let fakeUnhashedToken = 'this is a fake hash'

      let valid = validateToken(fakeUnhashedToken, fakeTokenObj)

      valid.should.be.true
      assert.calledOnce(bcryptCompareStub)
      bcryptCompareStub.getCall(0).args[0].should.be.equal(fakeUnhashedToken)
      bcryptCompareStub.getCall(0).args[1].should.be.equal(fakeTokenObj.token)
    })

    it('should return false if the jwt is not valid', () => {
      bcryptCompareStub.returns(false)

      let valid = validateToken('this is a fake hash', fakeTokenObj)

      valid.should.be.false
    })

    it('should return false for an expired token', () => {
      let mockTokenObj = {
        token: 'somestr',
        expiration: Date.now() - 1000 * 3600, // an expired date
      }
      let valid = validateToken("this doesn't even matter!", mockTokenObj)

      valid.should.be.false
    })
  })

  describe('create and validate one time use token workflow', () => {
    let randomTokenStub: SinonStub
    const unhashedToken = '1234567890fjklso'
    beforeEach(() => {
      randomTokenStub = stub(randomstring, 'generate').returns(unhashedToken)
    })
    afterEach(() => {
      randomTokenStub.restore()
    })

    it('should create and validate a one time use token with default expiration', () => {
      let { unhashedToken, tokenObj } = createOneTimeTokenObject(false)
      let valid = validateToken(unhashedToken, tokenObj)
      valid.should.be.true
    })

    it('should create and validate a one time use token with custom expiration', () => {
      let { unhashedToken, tokenObj } = createOneTimeTokenObject(1)
      let valid = validateToken(unhashedToken, tokenObj)
      valid.should.be.true
    })
  })
  describe('generateOAuthObject', () => {
    let hashStub: SinonStub
    const fakeHashReturn = 'fakehash'
    beforeEach(() => {
      hashStub = stub(bcrypt, 'hashSync').returns(fakeHashReturn)
    })
    afterEach(() => {
      hashStub.restore()
    })
    it('should generate a valid oauth object', () => {
      const { id, type, singleUseToken, singleUseTokenExpiration } = generateOAuthObject('123', 'google')
      expect(id).to.be.equal('123')
      expect(type).to.be.equal('google')
      expect(singleUseToken).to.be.equal(fakeHashReturn)
      expect(singleUseTokenExpiration).to.be.approximately(
        Date.now() + 1000 * 60,
        100,
        'expected singleUseTokenExpiration close to an hour from now',
      )
    })
  })
})
