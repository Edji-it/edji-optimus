// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('../../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function (tokenName: string, unhashedToken: string, authToken?: string, user_id?: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/tokens/${tokenName}/${unhashedToken}?user_id=${user_id}`)
    .send({ [validResetProperty]: 'someValue' })

  authToken && req.set('Authorization', authToken)
  return req
}

// setup test data
const validUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const validUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id
const validResetProperty: string = 'email' // an example of a valid token to be used with error testing
const exampleUnhashedToken: string = 'jkfdlajfkldsajfkdsal'

describe('POST api/v1/users/tokens/:token_name/:unhashed_token', () => {
  it('should receive a 400 for a request without an authorization header and no user_id specified', async () => {
    let res = await request(validResetProperty, exampleUnhashedToken)
    res.should.have.status(400)
  })
  it('should receive a 404 for a user id which does not exist', async () => {
    let res = await request(validResetProperty, exampleUnhashedToken, undefined, '5ac11efe610ff7addc74f52f')
    res.should.have.status(404)
  })
  it('should receive a 404 for a request to set an invalid property name', async () => {
    let res = await request('def_not_a_property', exampleUnhashedToken, validUserToken)
    res.should.have.status(400)
  })
  it('should receive a 400 for an invalid unhashed token', async () => {
    let res = await request(validResetProperty, exampleUnhashedToken, validUserToken)
    res.should.have.status(400)
  })
})