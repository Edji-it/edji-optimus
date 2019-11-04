// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project reports
import * as data from '../../../../test/constants'
import { UserAPI } from '../../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(authToken?: string): Request {
  let req = chai.request(data.SERVER).get(`/api/v1/users/messages`)

  authToken && req.set('Authorization', authToken)

  return req
}

describe('GET /api/v1/users/messages', () => {
  let authToken: string
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_HERO
    const { token } = await UserAPI.login(username, password)
    authToken = token
  })
  it("should get an existing user's messages", async () => {
    const response = await request(authToken)
    expect(response).to.have.status(200)
    expect(response).to.deep.equal({})
  })
  it("should get a new user's messages")
  it('should get a 401 without auth')
})
