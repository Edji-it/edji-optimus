import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { ObjectId } from 'mongodb'

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(reading: any, authToken: string) {
  let req = chai
    .request(data.SERVER)
    .post(`/api/v1/readings/`)
    .send({ reading })

  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let ownerId: string

describe('POST /api/v1/readings', () => {
  const createdReadings: string[] = []
  before(async () => {
    const { username: createReadingUsername, password: createReadingPassword } = data.LOGIN_INFO.API_TEACHER
    let userRes = await UserAPI.login(createReadingUsername, createReadingPassword)
    authToken = userRes.token
    ownerId = userRes.user._id
  })
  after(async () => {
    if (createdReadings.length > 0) {
      for (let reading of createdReadings) {
        await ReadingAPI.delete(reading, authToken)
      }
    }
  })

  it('should create a reading', async () => {
    let createReading: any = { ...data.READINGS.NEW_READING }
    chai.should().not.exist(createReading.version_id)
    let res = await request(createReading, authToken)
    res.should.have.status(201)
    res.body.should.have.property('reading')

    // reading validation
    let reading = res.body.reading
    createdReadings.push(reading._id) // stores reading for later tests
    reading.should.have.property('_id')
    reading.should.have.property('owner_id')
    reading.should.have.property('title')
    reading.should.have.property('words')
    reading.should.have.property('html')
    reading.should.have.property('promoter_ids')
    reading.should.have.property('createdAt')
    reading.should.have.property('updatedAt')
  })
  it('should create a reading and keep the version id', async () => {
    // tests copy and edit functionality
    let createReading: any = {
      ...data.READINGS.NEW_READING,
      owner_id: ownerId,
      version_id: new ObjectId(),
    }
    let res = await request(createReading, authToken)
    res.should.have.status(201)
    res.body.should.have.property('reading')
    res.body.reading.should.have.property('version_id')
    res.body.reading.version_id.should.be.equal(createReading.version_id.toString())
    createdReadings.push(res.body.reading._id)
  })
  it('should create a reading as a draft', async () => {
    let createReading: any = {
      ...data.READINGS.NEW_READING,
      draft: true,
    }
    let res = await request(createReading, authToken)
    res.should.have.status(201)
    res.body.should.have.property('reading')
    res.body.reading.should.have.property('draft')
    res.body.reading.draft.should.be.true
  })
  it('should reject a reading without required fields', async () => {
    let createReading = {}
    let res = await request(createReading, authToken)
    res.should.have.status(406)
    res.body.should.have.property('validationErrors')
  })
  it('should reject a request without a reading', async () => {
    let res = await request(undefined, authToken)
    res.should.have.status(400)
  })
  it('should reject an unauthorized request', async () => {
    let createReading = { ...data.READINGS.NEW_READING }
    let res = await request(createReading, undefined)
    res.should.have.status(401)
  })
})
