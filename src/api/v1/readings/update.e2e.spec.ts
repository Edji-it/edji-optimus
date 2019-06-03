// library imports
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'
import { pick } from 'underscore'

// project imports
import { UserAPI, ReadingAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)

let authToken: string
let createdReading: any

const request = function(readingId: string, body: any, authToken?: string): Request {
  let req = chai
    .request(data.SERVER)
    .put(`/api/v1/readings/${readingId}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('PUT /api/v1/readings/:reading_id', () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { token } = await UserAPI.login(username, password)
    authToken = token
  })
  before(async () => {
    const { reading } = await ReadingAPI.create(authToken)
    createdReading = reading
  })
  after(async () => {
    await ReadingAPI.delete(createdReading._id, authToken)
  })
  it('should allow an update of all updateable properties', async () => {
    const update = {
      html: "<div>I'm new here</div>",
      words: [{ prop: true }],
      title: 'updated title',
      public: !createdReading.public,
      source: 'reading update test',
      cover_img: 'cover image url',
      tags: ['tag1_update'],
      draft: !createdReading.draft,
      questions: [
        {
          prompt: 'answer this',
          type: 'open-ended',
          answer_types: ['text'],
        },
      ],
      subjects: ['geography'],
      grade_levels: [7, 8, 9],
      owner_bookmarked: !createdReading.owner_bookmarked,
    }
    /** @todo include createdAt in this test */
    const res = await request(createdReading._id, update, authToken)
    expect(res).to.have.status(200)
    const reading = await ReadingAPI.retrieve(createdReading._id, authToken)
    const deepEqualCompare = Object.keys(update).filter(key => key !== 'questions')
    expect(pick(reading, deepEqualCompare)).to.deep.equal(pick(update, deepEqualCompare))
    expect(reading.questions).lengthOf(update.questions.length)
    expect(pick(reading.questions[0], Object.keys(update.questions[0]))).to.deep.equal(update.questions[0])
  })
  it('should reject an invalid update', async () => {
    const update = {
      draft: 'this is not a boolean',
    }
    const res = await request(createdReading._id, update, authToken)
    expect(res).to.have.status(406)
  })
  it('should reject if trying to update a property which is not updateable', async () => {
    const update = {
      owner_id: new ObjectId(),
    }
    const res = await request(createdReading._id, update, authToken)
    expect(res).to.have.status(400)
  })
  it('should reject a request to update an invalid id', async () => {
    const res = await request('12345', {}, authToken)
    expect(res).to.have.status(400)
  })
  it('should reject if the user does not own the reading', async () => {
    const { username, password } = data.LOGIN_INFO.API_HERO
    const { token } = await UserAPI.login(username, password)
    const res = await request(createdReading._id, { subjects: ['science'] }, token)
    expect(res).to.have.status(403)
  })
  it('should reject if the user is not logged in', async () => {
    const res = await request(createdReading._id, { tags: ['hi_mom'] })
    expect(res).to.have.status(401)
  })
})
