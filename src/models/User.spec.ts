// library imports
import 'mocha'
import { expect } from 'chai'
import { stub, SinonStub, assert, mock, SinonMock } from 'sinon'
require('sinon-mongoose')

// project imports
import User, { OAuthObject, fromOAuthUser } from './User'
import * as UserHelpers from './_User'

const createUserInfo = function(identities?: string[]) {
  return {
    username: 'bot_' + Date.now().toString(),
    fullname: 'newApiTestUser',
    password: 'codycodycody',
    email: Date.now().toString() + '_bot@edji.it',
    identities: identities && identities.length > 0 ? identities : ['teacher', 'business'],
    avatar: '//image-dev.edji.it/avatar/test.png',
  }
}

describe('User model', () => {
  describe('validate', () => {
    it('should create a valid user', async () => {
      const userInfo = createUserInfo()
      const user = new User(userInfo)
      await user.validate()
    })
    it('should ignore extra properties', async () => {
      const userInfo = {
        ...createUserInfo(),
        id: '12345', // chose id specifically because it will be passed in by oauth creation methods
      }
      const user = new User(userInfo)
      await user.validate()
      expect(user.id).not.to.exist
    })
    it('should require an email', async () => {
      const userInfo = {
        ...createUserInfo(),
        email: '',
      }
      const user = new User(userInfo)
      try {
        await user.validate()
      } catch (err) {
        expect(err).to.haveOwnProperty('errors')
        expect(err.errors).to.haveOwnProperty('email')
        expect(err.errors.email).to.haveOwnProperty('kind')
        expect(err.errors.email.kind).to.be.equal('required')
        return // this is what we expect
      }
      throw new Error('user validation expected to fail but it passed')
    })
    it('should allow a Clever user to be created without an email', async () => {
      let userInfo = {
        ...createUserInfo(),
        oauth: [
          {
            type: 'clever',
            id: '12345',
          },
        ],
      }
      delete userInfo.email
      const user = new User(userInfo)
      await user.validate()
    })
    it('should return an error if auth is invalid', async () => {
      const userInfo = createUserInfo()
      delete userInfo.password
      const user = new User(userInfo)
      try {
        await user.validate()
      } catch (err) {
        return // this is what we expect
      }
      throw new Error('user validation expected to fail but it passed')
    })
    it('should return an error for an invalid email', async () => {
      const testEmails = ['thisisnotvalid@something', 'thisisnotvalid', 'thisisnotvalid@']
      for (let i = 0; i < testEmails.length; i++) {
        const userInfo = {
          ...createUserInfo(),
          email: testEmails[i],
        }
        const user = new User(userInfo)
        try {
          await user.validate()
        } catch (err) {
          continue // this is what we expect
        }
        throw new Error('user validation expected to fail but it passed')
      }
    })
    it('should clean an email with spaces before validating', async () => {
      const userInfo = {
        ...createUserInfo(),
        email: 'has spaces@something.com',
      }
      const user = new User(userInfo)
      await user.validate()
      expect(user.email).to.be.equal('hasspaces@something.com')
    })
    it('should accept an email with special characters like ñ', async () => {
      const userInfo = {
        ...createUserInfo(),
        email: 'fel_is_ñavi_dad@spanish.com',
      }
      const user = new User(userInfo)
      await user.validate()
    })
  })
  describe('findAndGenerateOAuthLogin', () => {
    let findOneAndUpdateStub: SinonStub
    beforeEach(() => {
      findOneAndUpdateStub = stub(User, 'findOneAndUpdate').returns(<any>{ exec: stub().resolves() })
    })
    afterEach(() => {
      findOneAndUpdateStub.restore()
    })
    it('should update and return the user', async () => {
      const mockAuth: OAuthObject = {
        id: 12345,
        type: 'google',
        singleUseToken: '$2a$04$7S.IEZau6dLeOqfPfJUST.Im5Ye4g843njaHhmMwlzPgjEAvaHknS',
        singleUseTokenExpiration: Date.now(),
      }
      await User.findAndGenerateOAuthLogin(mockAuth)
      assert.calledOnce(findOneAndUpdateStub)
      const { args } = findOneAndUpdateStub.getCall(0)
      expect(args).to.be.lengthOf(3)
      expect(args[0]).to.deep.equal({
        'oauth.id': 12345,
        'oauth.type': 'google',
      })
      expect(args[1]).to.haveOwnProperty('$set')
      expect(args[1].$set['oauth.$.singleUseToken']).to.be.equal(
        '$2a$04$7S.IEZau6dLeOqfPfJUST.Im5Ye4g843njaHhmMwlzPgjEAvaHknS',
      )
      expect(args[1].$set['oauth.$.singleUseTokenExpiration']).to.be.approximately(
        mockAuth.singleUseTokenExpiration,
        200,
      )
      expect(args[2]).to.deep.equal({
        new: true,
        runValidators: true,
      })
    })
  })
  describe('setPendingOAuth', () => {
    let updateStub: SinonStub
    beforeEach(() => {
      updateStub = stub(User, 'updateOne').returns(<any>{ exec: stub().resolves() })
    })
    afterEach(() => {
      updateStub.restore()
    })
    it('should update and return the user', async () => {
      const oauthObj: OAuthObject = {
        id: 12345,
        type: 'google',
        singleUseToken: '$2a$04$7S.IEZau6dLeOqfPfJUST.Im5Ye4g843njaHhmMwlzPgjEAvaHknS',
        singleUseTokenExpiration: Date.now(),
      }
      const email = 'corbin@edji.it'
      await User.setPendingOAuth({ email, oauthObj })
      assert.calledOnce(updateStub)
      const { args } = updateStub.getCall(0)
      expect(args).to.be.lengthOf(2)
      expect(args).to.deep.equal([
        { email },
        {
          $set: {
            pending_oauth: oauthObj,
          },
        },
      ])
    })
  })
})
describe('fromOAuthUser', () => {
  let generateOauthObjectStub: SinonStub
  const userInfo = {
    id: '12345',
    email: 'corbin@edji.it',
    fullname: 'corbin fonville',
    avatar: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x.png',
  }
  beforeEach(() => {
    generateOauthObjectStub = stub(UserHelpers, 'generateOAuthObject').returns({
      id: '12345',
      singleUseToken: '$2a$04$7S.IEZau6dLeOqfPfJUST.Im5Ye4g843njaHhmMwlzPgjEAvaHknS',
      singleUseTokenExpiration: 1557108624539,
      type: 'google',
    })
  })
  afterEach(() => {
    generateOauthObjectStub.restore()
  })
  it('should return the expected properties', () => {
    const { user, oauthObj } = fromOAuthUser(userInfo)
    assert.calledOnce(generateOauthObjectStub)
    expect(oauthObj).to.deep.equal({
      id: '12345',
      singleUseToken: '$2a$04$7S.IEZau6dLeOqfPfJUST.Im5Ye4g843njaHhmMwlzPgjEAvaHknS',
      singleUseTokenExpiration: 1557108624539,
      type: 'google',
    })
    expect(user).to.be.instanceOf(User)
  })
  it('should create a valid user', async () => {
    const { user } = fromOAuthUser(userInfo)
    await user.validate()
  })
})
