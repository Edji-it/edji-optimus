// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('../../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function (userId: string, tokenName: string, unhashedToken: string, authToken?: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/${userId}/tokens/${tokenName}/${unhashedToken}`)

  authToken && req.set('Authorization', authToken)
  return req
}

// setup test data
const validUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const validUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id
const validResetProperty: string = 'reset_email' // an example of a valid token to be used with error testing
const exampleUnhashedToken: string = 'jkfdlajfkldsajfkdsal'

describe('POST api/v1/users/:user_id/tokens/:token_name/:unhashed_token', () => {
  it('should receive a 401 for a request without an authorization header', async () => {
    let res = await request(validUserId, validResetProperty, exampleUnhashedToken)
    res.should.have.status(401)
  })
  it('should receive a 401 for a request from a user id that does not match the url given on the endpoint', async () => {
    let res = await request('not-my-user-id', validResetProperty, exampleUnhashedToken, validUserToken)
    res.should.have.status(401)
  })
  it('should receive a 404 for a request to set an invalid property name', async () => {
    let res = await request(validUserId, 'def_not_a_property', exampleUnhashedToken, validUserToken)
    res.should.have.status(404)
  })
  it('should receive a 400 for an invalid unhashed token', async () => {
    let res = await request(validUserId, validResetProperty, exampleUnhashedToken, validUserToken)
    res.should.have.status(400)
  })
})