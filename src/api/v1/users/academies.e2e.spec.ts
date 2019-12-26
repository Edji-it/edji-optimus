// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import * as data from '../../../test/constants'
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(authToken?: string): Request {
  let req = chai.request(data.SERVER).get(`/api/v1/users/@me/academies`)

  authToken && req.set('Authorization', authToken)

  return req
}

describe('/api/v1/users/@me/academies', () => {
  describe('GET', async () => {
    it('should get a users academies for a Hero', async () => {
      const { username, password } = data.LOGIN_INFO.ACADEMY_HERO
      const { token } = await UserAPI.login(username, password)
      const res = await request(token)
      expect(res).to.have.status(200)
      expect(res.body)
        .to.have.property('academies')
        .instanceOf(Array)
        .lengthOf(1)
      const academy = res.body.academies[0]
      expect(academy).to.have.property('_id', '5b006d759dbfbf137ec0df23')
      expect(academy)
        .to.have.property('roles')
        .lengthOf(0)
      expect(academy).to.have.property('name', 'Edji Test')
      expect(academy).to.have.property('abbreviation', 'ET')
      expect(academy)
        .to.have.property('outcomes')
        .instanceOf(Array)
        .lengthOf(2)
      expect(academy).to.have.property('link_tokens')
    })
    it('should get a users academies for an Admin', async () => {
      const { username, password } = data.LOGIN_INFO.ACADEMY_ADMIN
      const { token } = await UserAPI.login(username, password)
      const res = await request(token)
      expect(res).to.have.status(200)
      expect(res.body)
        .to.have.property('academies')
        .lengthOf(1)
      expect(res.body.academies[0])
        .to.have.property('roles')
        .lengthOf(1)
        .includes('administrator')
    })
    it('should return an empty array if the user does not have an academy', async () => {
      const { username, password } = data.LOGIN_INFO.API_TEACHER
      const { token } = await UserAPI.login(username, password)
      const res = await request(token)
      expect(res).to.have.status(200)
      expect(res.body)
        .to.have.property('academies')
        .lengthOf(0)
    })
    it('should reject an unauthorized request', async () => {
      const res = await request()
      expect(res).to.have.status(401)
    })
  })
})
