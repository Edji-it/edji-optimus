// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import data = require('../../../test/constants')
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const request = function (type: string, authToken?: string): Request {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/readings/${type}`)

  authToken && req.set('Authorization', authToken)
  return req
}
const loginUser = function ({ username, password }) {
  return UserAPI.login(username, password)
}

describe('GET /readings/:temp_type', () => {
  it('should get a 401 for a request without an authorization header', async () => {
    let res = await request('draft')
    res.should.have.status(401)
  })
  it('should receive a 400 if requesting readings of an unaccepted type', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)
    let res = await request('nothing', token)
    res.should.have.status(400)
  })
  it('should return multiple drafts', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)

    let res = await request('draft', token)
    res.should.have.status(200)
    res.body.should.have.property('readings')
    res.body.readings.should.be.instanceOf(Array)
    res.body.readings.length.should.be.above(1)
    res.body.readings.forEach((reading) => {
      reading.should.have.property('_id')
      reading.owner_id.should.be.equal(user._id.toString())
      reading.should.have.property('owner_id')
      reading.should.have.property('title')
      reading.should.have.property('teacher_ids')
      reading.should.have.property('createdAt')
      reading.should.have.property('updatedAt')
      reading.should.have.property('draft')
      reading.draft.should.be.true

      // things the reading should NOT have
      reading.should.not.have.property('words')
      reading.should.not.have.property('html')
    })
  })
  it('should return bookmarked readings', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)

    let res = await request('owner_bookmarked', token)
    res.should.have.status(200)
    res.body.should.have.property('readings')
    res.body.readings.should.be.instanceOf(Array)
    res.body.readings.length.should.be.above(1)
    res.body.readings.forEach((reading) => {
      reading.should.have.property('_id')
      reading.owner_id.should.be.equal(user._id.toString())
      reading.should.have.property('owner_id')
      reading.should.have.property('title')
      reading.should.have.property('teacher_ids')
      reading.should.have.property('createdAt')
      reading.should.have.property('updatedAt')
      reading.should.have.property('owner_bookmarked')
      reading.owner_bookmarked.should.be.true

      // things the reading should NOT have
      reading.should.not.have.property('words')
      reading.should.not.have.property('html')
    })
  })
})