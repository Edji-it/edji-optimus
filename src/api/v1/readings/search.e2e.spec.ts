// library imports
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')

// project imports
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
    expect(allDates).to.deep.equal(allDatesSorted)
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
    expect(allDates).to.deep.equal(allDatesSorted)
  })
  it('should populate projects', async () => {
    const res = await searchRequest(['pop=projects', 'scope=owner'], token)
    expect(res).to.have.status(200)
    expect(res.body.results.length).to.be.above(10)
    let numberProjectsValidated = 0
    for (let reading of res.body.results) {
      expect(reading).to.haveOwnProperty('projects')
      reading.projects.forEach(project => {
        expect(project).to.haveOwnProperty('reading_id')
        expect(project).to.haveOwnProperty('teacher_id')
        expect(project).to.haveOwnProperty('label')
        expect(project).to.haveOwnProperty('code')
        expect(project).to.haveOwnProperty('types')
        expect(project).to.haveOwnProperty('createdAt')
        expect(project).to.haveOwnProperty('updatedAt')
        expect(project).to.haveOwnProperty('comment_count')
        expect(project).to.haveOwnProperty('student_count')
        numberProjectsValidated++
      })
    }
    expect(numberProjectsValidated).to.be.above(0)
  })
  it('should return buckets', async () => {
    const res = await searchRequest(['buckets=subjects', 'buckets=tags'], token)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('buckets')
    const buckets = res.body.buckets
    expect(buckets).to.haveOwnProperty('subjects')
    expect(buckets).to.haveOwnProperty('tags')
    expect(buckets.subjects.length, 'expected subjects to have a non-zero length').to.be.greaterThan(0)
    for (let subject of buckets.subjects) {
      expect(subject).to.haveOwnProperty('key')
      expect(subject).to.haveOwnProperty('doc_count')
    }
  })
  it('should return the query for debugging', async () => {
    const res = await searchRequest(['debug=true'], token)
    expect(res).to.have.status(200)
    expect(res.body).to.have.property('debug')
  })
  it('should not populate projects on public scope', async () => {
    const res = await searchRequest(['pop=projects'], token)
    expect(res).to.have.status(400)
  })
  it('should allow a request without authentication for public scope', async () => {
    const res = await searchRequest(['scope=public'])
    expect(res).to.have.status(200)
  })
  it('should reject a request for scope owner without authentication', async () => {
    const res = await searchRequest(['scope=owner'])
    expect(res).to.have.status(401)
  })
})
