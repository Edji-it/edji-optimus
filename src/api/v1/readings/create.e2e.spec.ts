import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

let authToken: string

const request = function (reading: any, authToken?: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/readings/`)
    .send({ reading })

  authToken && req.set('Authorization', authToken)
  return req
}

describe('POST /api/v1/readings', () => {
  before(async () => {
    const createReadingUsername = data.LOGIN_INFO.API_TEACHER.username
    const createReadingPassword = data.LOGIN_INFO.API_TEACHER.password
    let userRes = await UserAPI.login(createReadingUsername, createReadingPassword)
    authToken = userRes.token
  })
  it('should create a reading', async () => {
    let reading = { ...data.READINGS.NEW_READING }
    let res = await request(reading, authToken)
    res.should.have.status(200)
  })
  it('should create a reading using a version_id')
  it('should create a reading as a draft')
  it('should reject a reading without required fields')
  it('should reject a request without a reading', async () => {
    let res = await request(undefined, authToken)
    res.should.have.status(400)
  })
  it('should reject an unauthorized request')
})