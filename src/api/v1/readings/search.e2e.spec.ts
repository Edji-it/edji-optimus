import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { ObjectId } from 'mongodb'

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const searchRequest = function (queries: string[], authToken?: string) {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/readings/_search?${queries.join('&')}`)

  authToken && req.set('Authorization', authToken)
  return req
}

let token
let user

describe('GET /api/v1/readings/_search', () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_HERO
    let userRes = await UserAPI.login(username, password)
    token = userRes.token
    user = userRes.user
    expect(token).to.exist
    expect(user).to.exist
  })
  it('should get readings without a query', async () => {
    const res = await searchRequest([], token)
    expect(res.body).to.have.property('total')
    expect(res.body.total).to.be.above(100) // just want to check that it's plenty
    expect(res.body).to.have.property('results')
    expect(res.body.results).to.be.instanceOf(Array)
    expect(res.body.results).to.be.lengthOf(15)
  })
  it('should change the size of the request based on the query', async () => {
    const res = await searchRequest(['size=15'], token)
    expect(res.body.results).to.be.instanceOf(Array)
    expect(res.body.results).to.be.lengthOf(15)
  })
  it('should change the start of results based on the query', async () => {
    const testFrom = 5
    const baseQuery = []
    const res1 = await searchRequest(baseQuery, token)
    const initialSequence = res1.body.results
    const res2 = await searchRequest(baseQuery.concat([`from=${testFrom}`]), token)
    expect(initialSequence[testFrom - 1]._id).to.be.equal(res2.body.results[0]._id)
  })
  it('should query the title for a string', async () => {
    const titleQuery = 'test'
    const res = await searchRequest([`title=${titleQuery}`], token)
    expect(res.body.results.length).to.be.above(0)
    expect(res.body.results[0]).to.have.property('title')
    expect(res.body.results[0].title.toLowerCase()).to.include(titleQuery)
  })
  it('should reject a request without authentication', async () => {
    const res = await searchRequest([])
    expect(res).to.have.status(401)
  })
})