// library imports
import { expect } from 'chai'
import { assert, stub, SinonStub } from 'sinon'
import * as sentry from '@sentry/node'

// project imports
import {
  getRedirectURI,
  RedirectParams,
  getTokenRedirectDestination,
  oauthCallbackHandler,
  getUser,
  redirectToProvider,
} from './oauth'
import * as helpers from './oauth'
import * as User from './../../../models/User'
import * as google from './../../../services/google'
import clever from './../../../services/clever'

describe('oauth helpers', () => {
  const { CLIENT_URL, NODE_ENV } = process.env
  beforeEach(() => {
    process.env.CLIENT_URL = '//edji.it'
    process.env.NODE_ENV = 'development'
  })
  after(() => {
    Object.assign(process.env, { CLIENT_URL, NODE_ENV })
  })
  describe('getRedirectURI', () => {
    const defaultParams: RedirectParams = {
      type: 'google',
      singleUseToken: '$2a$04$8PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
    }
    it('should generate a successful google redirect', () => {
      const uri = getRedirectURI(defaultParams)
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/google?token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a successful clever redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        type: 'clever',
      })
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/clever?token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a duplicate user redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        error: 'duplicate_user',
      })
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/google?error=duplicate_user&token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a server error redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        error: 'serverError',
        singleUseToken: '',
      })
      expect(uri).to.be.equal('https://edji.it/#/oauth/google?error=serverError')
    })
    it('should change the redirect if the CLIENT_URL changes', () => {
      process.env.CLIENT_URL = '//dev.edji.it'
      const uri = getRedirectURI(defaultParams)
      expect(uri).to.be.equal(
        'https://dev.edji.it/#/oauth/google?token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
  })
  describe('getTokenRedirectDestination', () => {
    const getUserRes = <any>{
      user: { _id: 123, email: 'hello@edji.it', edjiSave: stub().resolves() },
      oauthObj: { singleUseToken: '54321' },
    }
    let getUserStub: SinonStub
    let findAndGenerateOAuthLoginStub: SinonStub
    let setPendingOAuthStub: SinonStub
    let edjiSaveStub: SinonStub = getUserRes.user.edjiSave
    let sentryStub: SinonStub
    beforeEach(() => {
      getUserStub = stub(helpers, 'getUser').resolves(getUserRes)
      findAndGenerateOAuthLoginStub = stub(User.default, 'findAndGenerateOAuthLogin').resolves()
      setPendingOAuthStub = stub(User.default, 'setPendingOAuth').resolves()
      edjiSaveStub.resetHistory()
      sentryStub = stub(sentry, 'captureException')
    })
    afterEach(() => {
      getUserStub.restore()
      findAndGenerateOAuthLoginStub.restore()
      setPendingOAuthStub.restore()
      sentryStub.restore()
    })
    it('should return correct destination for an existing user who is logging in', async () => {
      findAndGenerateOAuthLoginStub.resetBehavior()
      findAndGenerateOAuthLoginStub.resolves({})
      const redirectTo = await getTokenRedirectDestination('google', 'a_unique_oauth_code')
      assert.calledOnce(getUserStub)
      assert.calledWithExactly(getUserStub, 'google', 'a_unique_oauth_code')
      assert.calledOnce(findAndGenerateOAuthLoginStub)
      assert.notCalled(edjiSaveStub)
      assert.notCalled(setPendingOAuthStub)
      expect(redirectTo).to.be.equal('https://edji.it/#/oauth/google?token=54321')
    })
    it('should return correct destination for a new user', async () => {
      const redirectTo = await getTokenRedirectDestination('clever', 'a_unique_oauth_code')
      assert.calledOnce(edjiSaveStub)
      assert.notCalled(setPendingOAuthStub)
      expect(redirectTo).to.be.equal('https://edji.it/#/oauth/clever?token=54321')
    })
    it('should return correct destination for an existing user who is a duplicate', async () => {
      edjiSaveStub.resetBehavior()
      edjiSaveStub.throws({ code: 11000 })
      const redirectTo = await getTokenRedirectDestination('clever', 'a_unique_oauth_code')
      assert.calledOnce(edjiSaveStub)
      assert.calledOnce(setPendingOAuthStub)
      assert.calledWithExactly(setPendingOAuthStub, { email: 'hello@edji.it', oauthObj: { singleUseToken: '54321' } })
      expect(redirectTo).to.be.equal('https://edji.it/#/oauth/clever?error=duplicate_user&token=54321')
    })
    it('should return correct destination for an error', async () => {
      edjiSaveStub.resetBehavior()
      edjiSaveStub.throws()
      const redirectTo = await getTokenRedirectDestination('clever', 'a_unique_oauth_code')
      assert.calledOnce(edjiSaveStub)
      assert.notCalled(setPendingOAuthStub)
      assert.calledOnce(sentryStub)
      expect(redirectTo).to.be.equal('https://edji.it/#/oauth/clever?error=serverError')
    })
  })
  describe('getUser', () => {
    const testToken = 'fhudiaugiorunvjalnid'
    const getTokenStub = stub().resolves({ access_token: testToken })
    const createResult: any = {
      authorizationCode: {
        getToken: getTokenStub,
      },
    }
    const profile = {
      someProp: Date.now(),
    }
    let getGoogleInfoStub: SinonStub
    let fromOAuthUserStub: SinonStub
    let createClientStub: SinonStub
    let initStub: SinonStub
    let getCleverInfoStub: SinonStub
    beforeEach(() => {
      getGoogleInfoStub = stub(google, 'getGoogleInfo').resolves(<any>profile)
      fromOAuthUserStub = stub(User, 'fromOAuthUser').resolves()
      createClientStub = stub(helpers, 'createOAuthClient').returns(createResult)
      initStub = stub(clever.prototype, 'init').resolves()
      getCleverInfoStub = stub(clever.prototype, 'getCleverInfo').resolves(<any>profile)
    })
    afterEach(() => {
      getGoogleInfoStub.restore()
      fromOAuthUserStub.restore()
      getTokenStub.resetHistory()
      createClientStub.restore()
      initStub.restore()
      getCleverInfoStub.restore()
    })
    it('should get the user from google', async () => {
      await getUser('google', '12345')
      assert.calledOnce(createClientStub)
      assert.calledWithExactly(getGoogleInfoStub, testToken)
      assert.calledWithExactly(fromOAuthUserStub, profile, 'google')
    })
    it('should get the user from clever', async () => {
      await getUser('clever', '54321')
      assert.calledOnce(initStub)
      assert.calledOnce(getCleverInfoStub)
      assert.calledOnce(createClientStub)
      assert.calledWithExactly(fromOAuthUserStub, profile, 'clever')
    })
  })
  describe('oauthCallbackHandler', () => {
    const mockRequest = {
      query: {
        code: '1234',
      },
      params: {
        type: 'google',
      },
    }
    const redirectStub = stub()
    const mockResponse: any = {
      redirect: redirectStub,
    }
    const mockDestination = 'https://edji.it'
    let getDestinationStub: SinonStub
    beforeEach(() => {
      getDestinationStub = stub(helpers, 'getTokenRedirectDestination').resolves(mockDestination)
    })
    afterEach(() => {
      getDestinationStub.restore()
      redirectStub.resetHistory()
    })
    it('should call res.redirect with the destination', async () => {
      await oauthCallbackHandler(<any>mockRequest, <any>mockResponse, stub())
      assert.calledWithExactly(getDestinationStub, mockRequest.params.type, mockRequest.query.code)
      assert.calledWithExactly(redirectStub, mockDestination)
    })
    it('should use default error handling if there is an error', async () => {
      let mockNext = stub()
      let mockError = new Error('an error while getting redirect destination')
      getDestinationStub.resetBehavior()
      getDestinationStub.throws(mockError)
      await oauthCallbackHandler(<any>mockRequest, <any>mockResponse, mockNext)
      assert.calledWithExactly(mockNext, mockError)
    })
  })
  describe('redirectToProvider', () => {
    const getMockRequest = (type: User.OAuthType): any => {
      return {
        params: {
          type,
        },
      }
    }
    const redirectStub = stub()
    const mockResponse: any = {
      redirect: redirectStub,
    }
    const mockNext = stub()
    afterEach(() => {
      redirectStub.resetHistory()
      mockNext.resetHistory()
    })
    it('should redirect to the correct google url', async () => {
      redirectToProvider(getMockRequest('google'), mockResponse, mockNext)
      assert.calledOnce(redirectStub)
      assert.notCalled(mockNext)
      expect(redirectStub.getCall(0).args[0]).to.contain('https://accounts.google.com/o/oauth2/v2/auth')
    })
    it('should redirect to the correct clever url', () => {
      redirectToProvider(getMockRequest('clever'), mockResponse, mockNext)
      assert.calledOnce(redirectStub)
      assert.notCalled(mockNext)
      expect(redirectStub.getCall(0).args[0]).to.contain('https://clever.com/oauth/authorize')
    })
    it('should call next with an error if there is a failure', async () => {
      const mockError = new Error('an error for oauth')
      redirectStub.throws(mockError)
      redirectToProvider(getMockRequest('clever'), mockResponse, mockNext)
      assert.calledOnce(redirectStub)
      assert.calledWithExactly(mockNext, mockError)
    })
  })
})
