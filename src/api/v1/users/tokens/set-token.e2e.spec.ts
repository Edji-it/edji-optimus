// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('./../../../../../_test')

// prep for http calls
chai.use(chaiHttp)
const request = function (userId: string, tokenName: string, authToken?: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/${userId}/tokens/${tokenName}`)

  authToken && req.set('Authorization', authToken)
  return req
}

// setup test data
const validUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const validUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id
const validResetProperty: string = 'reset_email' // an example of a valid token to be used with error testing

describe('POST api/v1/users/tokens/:token_name', () => {
  it('should receive a 401 for a request without an authorization header', async () => {
    let res = await request(validUserId, validResetProperty)
    res.should.have.status(401)
  })
  it('should receive a 401 for a request from a user id that does not match the url given on the endpoint', async () => {
    let res = await request('not-my-user-id', validResetProperty, validUserToken)
    res.should.have.status(401)
  })
  it('should receive a 400 for a request to set an invalid token', async () => {
    let res = await request(validUserId, 'def_not_a_token', validUserToken)
    res.should.have.status(400)
  })
  it('should receive a 200 for an authorized user setting an email reset token', async () => {
    let res = await request(validUserId, 'reset_email', validUserToken)
    res.should.have.status(200)
  })
})