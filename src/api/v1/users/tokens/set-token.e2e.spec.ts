// library imports
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { stringify } from 'querystring'

// project imports
import data = require('../../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function(tokenName: string, options: { authToken?: string; query?: any } = {}): Request {
  const { authToken, query } = options
  const req = chai.request(data.SERVER).get(`/api/v1/users/tokens/${tokenName}?${stringify(query)}`)

  authToken && req.set('Authorization', authToken)
  return req
}

// setup test data
const validUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const validUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id
const validResetProperty: string = 'reset_email' // an example of a valid token to be used with error testing

describe('GET api/v1/users/:user_id/tokens/:token_name', () => {
  describe('set email token', () => {
    it('should receive a 400 for a request to set an invalid token', async () => {
      let res = await request('def_not_a_property', { authToken: validUserToken })
      expect(res).to.have.status(400)
    })
    it('should receive a 200 for an authorized user setting an email reset token', async () => {
      let res = await request('email', { authToken: validUserToken })
      expect(res).to.have.status(200)
    })
  })
  describe('set password token', () => {
    it('should receive a 200 for an unauthorized user', async () => {
      let res = await request('password', { query: { email: 'success@simulator.amazonses.com' } })
      expect(res).to.have.status(200)
    })
    it('should receive a 400 for an oauth-only account', async () => {
      const res = await request('password', { query: { email: 'google@edji.it' } })
      expect(res).to.have.status(400)
      expect(res.body).to.deep.equal({
        error: 'NO_LOGIN_CREDENTIALS',
        message: 'user has no username/password, but has at least one oauth account that could be used to log in',
        oauth_types: ['google'],
      })
    })
    it('should receive a 400 if neither username nor email are provided', async () => {
      const res = await request('password')
      expect(res).to.have.status(400)
    })
  })
})
