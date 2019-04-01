// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import * as data from './../../../test/constants'

// prep for http calls
chai.use(chaiHttp)

const request = function(body: any): Request {
  let req = chai
    .request(data.SERVER)
    .post(`/api/v1/users`)
    .send({ user: body })

  return req
}

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

const testUser = createUserInfo()

describe('POST /api/v1/users', () => {
  it('should register a user', async () => {
    const res = await request(testUser)

    expect(res).to.have.status(201)
    expect(res.body).to.haveOwnProperty('token')

    validateLoginObject(res.body)
  })

  /**
   * this test will pass if the initial create user test is not run
   */
  it('should not allow a duplicate username', async () => {
    // make the request with the same user info that we had above
    const res = await request({
      ...testUser,
      email: Date.now().toString() + '_bot@edji.it',
    })
    expect(res).to.have.status(409)
    expect(res.body).to.haveOwnProperty('duplicateFieldError')
    expect(res.body.duplicateFieldError).to.haveOwnProperty('field')
    expect(res.body.duplicateFieldError).to.haveOwnProperty('message')
    expect(res.body.duplicateFieldError.field).to.be.equal('username')
  })

  /**
   * this test will pass if the initial create user test is not run
   */
  it('should not allow a duplicate email', async () => {
    // make the request with the same user info that we had above
    const res = await request({
      ...testUser,
      username: 'bot_' + Date.now().toString(),
    })
    expect(res).to.have.status(409)
    expect(res.body).to.haveOwnProperty('duplicateFieldError')
    expect(res.body.duplicateFieldError).to.haveOwnProperty('field')
    expect(res.body.duplicateFieldError).to.haveOwnProperty('message')
    expect(res.body.duplicateFieldError.field).to.be.equal('email')
  })

  it('should catch profane names, usernames and invalid emails', async () => {
    const invalidUser = {
      ...createUserInfo(),
      username: 'fuck',
      fullname: 'twot',
      email: 'wrong@wrong',
      password: 'whatever',
    }
    const res = await request(invalidUser)
    expect(res).to.have.status(406)
    expect(res.body).to.haveOwnProperty('validationErrors')
    const { validationErrors } = res.body
    expect(validationErrors).to.haveOwnProperty('email')
    expect(validationErrors.email).to.be.equal('emailRegex')
    expect(validationErrors).to.haveOwnProperty('fullname')
    expect(validationErrors.fullname).to.be.equal('badWords')
    expect(validationErrors).to.haveOwnProperty('username')
    expect(validationErrors.username).to.be.equal('badWords')
  })

  it('should return required errors for all missing fields that are required', async () => {
    const res = await request({ identities: ['teacher'] })
    expect(res).to.have.status(406)
    expect(res.body).to.haveOwnProperty('validationErrors')
    const { validationErrors } = res.body
    // it would return these, but we're manually handling the validation of emails here
    // expect(validationErrors).to.haveOwnProperty('email')
    // expect(validationErrors.email).to.be.equal('required')
    expect(validationErrors).to.haveOwnProperty('fullname')
    expect(validationErrors.fullname).to.be.equal('required')
  })

  it('should return an error if auth requirements are not met', async () => {
    let noAuthUser = createUserInfo()
    delete noAuthUser.password
    const res = await request(noAuthUser)
    expect(res).to.have.status(406)
    expect(res.body).to.haveOwnProperty('validationErrors')
    const { validationErrors } = res.body
    expect(validationErrors).to.haveOwnProperty('auth')
  })
})

export function validateLoginObject({ user, token }: { user: any; token: string }) {
  // user validation
  expect(user).to.haveOwnProperty('_id')
  expect(user).to.haveOwnProperty('username')
  expect(user).to.haveOwnProperty('fullname')
  expect(user).to.haveOwnProperty('email')
  expect(user).to.haveOwnProperty('createdAt')
  expect(user).to.haveOwnProperty('updatedAt')
  expect(user).not.to.haveOwnProperty('password')
  expect(user).not.to.haveOwnProperty('resetPasswordToken')
  expect(user).not.to.haveOwnProperty('resetPasswordExpires')
  expect(user).not.to.haveOwnProperty('accountArchiveToken')

  // token validation
  expect(token).to.be.a('string')
  expect(token.length).to.be.greaterThan(0)
}
