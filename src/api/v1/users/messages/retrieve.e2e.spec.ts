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

const request = function(userId: string, authToken?: string): Request {
  let req = chai.request(data.SERVER).get(`/api/v1/users/${userId}/messages`)

  authToken && req.set('Authorization', authToken)

  return req
}

describe('GET /api/v1/users/messages', () => {
  it("should get an existing user's messages", async () => {
    const { username, password } = data.LOGIN_INFO.API_HERO
    const { user, token } = await UserAPI.login(username, password)
    const response = await request(user._id, token)
    expect(response).to.have.status(200)
    expect(response.body)
      .to.have.property('messages')
      .instanceOf(Array)
  })
  it("should get a new user's messages", async () => {
    const { user, token } = await UserAPI.create()
    const response = await request(user._id, token)
    expect(response).to.have.status(200)
    expect(response.body).to.deep.equal({
      messages: [],
    })
  })
  it('should get a 401 without auth', async () => {
    const response = await request('5b79c7562ea6d825a0002c28')
    expect(response).to.have.status(401)
  })
})
