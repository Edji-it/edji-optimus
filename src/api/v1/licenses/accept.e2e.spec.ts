// library import
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
chai.use(chaiHttp)
import { Request } from 'superagent'

// project imports
import * as TEST from './../../../test/constants'
import { UserAPI } from '../../../test/methods'

const request = function(licenseId: string, { authToken, type }: { authToken?: string; type?: string }): Request {
  const url = `/api/v1/licenses/${licenseId}/accept${type ? `?type=${type}` : ''}`
  const req = chai
    .request(TEST.SERVER)
    .put(url)
    .send({})

  authToken && req.set('Authorization', authToken)
  return req
}

describe('PUT /api/v1/licenses/accept', function() {
  let authToken
  const academyToken = '59bda3de709c57353bab8b8b'
  before(async () => {
    const { username, password } = TEST.LOGIN_INFO.API_HERO2
    const { token } = await UserAPI.login(username, password)
    authToken = token
  })
  it('should join an academy with a link token', async () => {
    const res = await request(academyToken, { authToken, type: 'academy_token' })
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('user')
    expect(res.body.user).to.have.property('_id', '59bda04a85c6ab346c12dbbc')
    expect(res.body.user.institution_ids).to.deep.equal(['5b006d759dbfbf137ec0df23'])
  })
  it('should get an error if the specified license does not exist', async () => {
    const res = await request('59bda3de709c57353bab8b8b', { authToken })
    expect(res).to.have.status(403)
    expect(res.body).to.have.property('error', 'invalid license')
  })
  it('should get an error if the license is invalid', async () => {
    const res = await request('123', { authToken })
    expect(res).to.have.status(400)
  })
  it('should get an error if the user is not authenticated', async () => {
    const res = await request('59bda3de709c57353bab8b8b', {})
    expect(res).to.have.status(401)
  })
})
