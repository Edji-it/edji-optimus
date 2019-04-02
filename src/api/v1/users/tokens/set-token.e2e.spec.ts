// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import data = require('../../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function(tokenName: string, authToken?: string): Request {
  let req = chai.request(data.SERVER).get(`/api/v1/users/tokens/${tokenName}`)

  authToken && req.set('Authorization', authToken)
  return req
}

// setup test data
const validUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const validUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id
const validResetProperty: string = 'reset_email' // an example of a valid token to be used with error testing

describe('GET api/v1/users/:user_id/tokens/:token_name', () => {
  it('should receive a 400 for a request to set an invalid token', async () => {
    let res = await request('def_not_a_property', validUserToken)
    res.should.have.status(400)
  })
  it('should receive a 200 for an authorized user setting an email reset token', async () => {
    let res = await request('email', validUserToken)
    res.should.have.status(200)
  })
})
