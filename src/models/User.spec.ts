// library imports
import 'mocha'
import { expect } from 'chai'

// project imports
import * as User from './User'

const createUserInfo = function (identities?: string[]) {
  return {
    username: 'bot_' + Date.now().toString(),
    fullname: 'newApiTestUser',
    password: 'codycodycody',
    email: Date.now().toString() + '_bot@edji.it',
    identities: identities && identities.length > 0 ? identities : ['teacher', 'business'],
    avatar: '//image-dev.edji.it/avatar/test.png'
  }
}

describe('User model', () => {
  it('should create a valid user', async () => {
    const userInfo = createUserInfo()
    const user = User(userInfo)
    await user.validate()
  })
  it('should require an email', async () => {
    const userInfo = {
      ...createUserInfo(),
      email: ''
    }
    const user = User(userInfo)
    try {
      await user.validate()
    } catch (err) {
      // console.log(err)
      expect(err).to.haveOwnProperty('errors')
      expect(err.errors).to.haveOwnProperty('email')
      expect(err.errors.email).to.haveOwnProperty('kind')
      expect(err.errors.email.kind).to.be.equal('required')
      return // this is what we expect
    }
    throw new Error('user validation expected to fail but it passed')
  })
  it('should return an error if auth is invalid', async () => {
    const userInfo = createUserInfo()
    delete userInfo.password
    const user = User(userInfo)
    try {
      await user.validate()
    } catch (err) {
      return // this is what we expect
    }
    throw new Error('user validation expected to fail but it passed')
  })
  it('should return an error for an invalid email', async () => {
    const testEmails = [
      'thisisnotvalid@something',
      'thisisnotvalid',
      'thisisnotvalid@'
    ]
    for (let i = 0; i < testEmails.length; i++) {
      const userInfo = {
        ...createUserInfo(),
        email: testEmails[i]
      }
      const user = User(userInfo)
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
      email: 'has spaces@something.com'
    }
    const user = User(userInfo)
    await user.validate()
    expect(user.email).to.be.equal('hasspaces@something.com')
  })
  it('should accept an email with special characters like ñ', async () => {
    const userInfo = {
      ...createUserInfo(),
      email: 'fel_is_ñavi_dad@spanish.com'
    }
    const user = User(userInfo)
    await user.validate()
  })
  // it('should create a Clever student without an email', async () => {
  //   const userInfo = {
  //     ...createUserInfo(),
  //     email: 'fel_is_ñavi_dad@spanish.com'
  //   }
  //   const user = User(userInfo)
  //   await user.validate()
  // })
})