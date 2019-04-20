import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const searchRequest = function(queries: string[], authToken?: string) {
  let req = chai.request(data.SERVER).get(`/api/v1/readings/_search?${queries.join('&')}`)

  authToken && req.set('Authorization', authToken)
  return req
}

let token: string
let user: any

describe('GET /api/v1/readings/_search', () => {
  let savedReadings
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
    expect(res).to.have.status(200)
    expect(res.body).to.have.property('total')
    expect(res.body.total).to.be.above(100) // just want to check that it's plenty
    expect(res.body).to.have.property('results')
    expect(res.body.results).to.be.instanceOf(Array)
    expect(res.body.results).to.be.lengthOf(15)
    expect(res.body.returned).to.be.equal(15)
    savedReadings = res.body.results
  })
  it('should change the size of the request based on the query', async () => {
    const res = await searchRequest(['size=10'], token)
    expect(res).to.have.status(200)
    expect(res.body.results).to.be.instanceOf(Array)
    expect(res.body.results).to.be.lengthOf(10)
  })
  it('should change the start of results based on the query', async () => {
    const testFrom = 5
    const baseQuery = []
    const res1 = await searchRequest(baseQuery, token)
    const initialSequence = res1.body.results
    const res2 = await searchRequest(baseQuery.concat([`from=${testFrom}`]), token)
    expect(initialSequence[testFrom]._id).to.be.equal(res2.body.results[0]._id)
  })
  it('should query the title for a string', async () => {
    const titleQuery = 'test'
    const res = await searchRequest([`title=${titleQuery}`], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(0)
    expect(res.body.results[0]).to.have.property('title')
    expect(res.body.results[0].title.toLowerCase()).to.include(titleQuery)
  })
  it('should sort results by a sort field', async () => {
    const res = await searchRequest([`sort=createdAt`], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(10) // just want to make sure we've got enough results that sorting is an effective test
    let allDates: string[] = res.body.results.map(({ createdAt }) => createdAt)
    let allDatesSorted = allDates.slice().sort((a, b) => {
      return new Date(a).getTime() > new Date(b).getTime() ? 1 : -1
    })
    expect(allDates).to.eql(allDatesSorted)
  })
  it('should get readings by owner', async () => {
    const res = await searchRequest(['scope=owner'], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(10) // just want to make sure we've got enough results that sorting is an effective test
    res.body.results.forEach(result => expect(result.owner_id).to.be.equal(user._id))
  })
  it('should change sort order', async () => {
    const res = await searchRequest([`sort=createdAt`, `sort_order=desc`], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(10) // just want to make sure we've got enough results that sorting is an effective test
    let allDates: string[] = res.body.results.map(({ createdAt }) => createdAt)
    let allDatesSorted = allDates.slice().sort((a, b) => {
      return new Date(a).getTime() > new Date(b).getTime() ? -1 : 1
    })
    expect(allDates).to.eql(allDatesSorted)
  })
  it('should populate projects', async () => {
    const res = await searchRequest(['pop=projects', 'scope=owner'], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(10)
    for (let reading of res.body.results) {
      expect(reading).to.haveOwnProperty('projects')
    }
  })
  it('should not populate projects on public scope', async () => {
    const res = await searchRequest(['pop=projects'], token)
    expect(res).to.have.status(400)
  })
  it('should reject a request without authentication', async () => {
    const res = await searchRequest([])
    expect(res).to.have.status(401)
  })
})
