// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))
import { Request } from 'superagent'
import { stringify } from 'querystring'

// project imports
import { UserAPI, ReadingAPI, ProjectAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// local variables
let authToken: string
let DEFAULT_READINGS_LIST
let createdReading
let createdProject

const request = function(query: any, authToken: string): Request {
  let req = chai.request(data.SERVER).get(`/api/v1/readings?${stringify(query)}`)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('GET /api/v1/readings', () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { token } = await UserAPI.login(username, password)
    authToken = token
  })
  before(async () => {
    const { reading } = await ReadingAPI.create(authToken)
    createdReading = reading
    const project = await ProjectAPI.create({ reading_id: createdReading._id }, authToken)
    createdProject = project
  })
  after(async () => {
    await ReadingAPI.delete(createdReading._id, authToken)
    await ProjectAPI.delete(createdProject._id, authToken)
  })

  it('should return a list of 15 readings with default properties', async () => {
    const res = await request({}, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('total')
    expect(res.body.total).to.be.above(15)
    expect(res.body).to.haveOwnProperty('readings')
    // readings tests
    const readings = res.body.readings
    expect(readings).to.be.instanceOf(Array)
    expect(readings).to.be.lengthOf(15)
    DEFAULT_READINGS_LIST = readings

    let lastReadingDate // used to test that the readings are in sort order from most to least recent
    readings.forEach(reading => {
      // things the reading SHOULD have
      expect(reading).to.haveOwnProperty('_id')
      expect(reading).to.haveOwnProperty('owner_id')
      expect(reading).to.haveOwnProperty('title')
      expect(reading).to.haveOwnProperty('version_count')
      expect(reading).to.haveOwnProperty('createdAt')
      expect(reading).to.haveOwnProperty('updatedAt')
      expect(!!reading.draft).to.be.false

      // things the reading should NOT have
      expect(reading).not.to.haveOwnProperty('words')
      expect(reading).not.to.haveOwnProperty('html')

      let thisReadingDate = new Date(reading.updatedAt)
      if (lastReadingDate) {
        expect(lastReadingDate.getTime()).to.be.greaterThan(thisReadingDate.getTime())
      }
      lastReadingDate = thisReadingDate
    })
    expect(lastReadingDate).to.exist
  })

  it('should return 20 readings with ?size=20 query parameter', async () => {
    const res = await request({ size: 20 }, authToken)
    expect(res).to.have.status(200)
    expect(res.body.readings).to.be.lengthOf(20)
  })

  it('should start at the next index with ?start=1 query parameter', async () => {
    const res = await request({ start: 1 }, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('readings')
    expect(res.body.readings[0]._id).to.be.equal(DEFAULT_READINGS_LIST[1]._id)
  })

  it('should populate projects onto the reading', async () => {
    const res = await request({ pop: 'projects' }, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('readings')
    let hasPopulatedProject = false
    res.body.readings.forEach(reading => {
      expect(reading).to.haveOwnProperty('projects')
      reading.projects.should.be.instanceOf(Array)

      // these tests might intermittently not run because none of the readings may have a project
      reading.projects.forEach(project => {
        hasPopulatedProject = true
        // every project should have these
        expect(project).to.haveOwnProperty('_id')
        expect(project).to.haveOwnProperty('reading_id')
        expect(project).to.haveOwnProperty('teacher_id')
        expect(project).to.haveOwnProperty('label')
        expect(project).to.haveOwnProperty('code')
        expect(project).to.haveOwnProperty('types')
        expect(project).to.haveOwnProperty('updatedAt')
        expect(project).to.haveOwnProperty('createdAt')
        expect(project).to.haveOwnProperty('comment_count')
        expect(project).to.haveOwnProperty('student_count')

        // no projects should have these
        expect(project).not.to.haveOwnProperty('heat_vision')
        expect(project).not.to.haveOwnProperty('answers')
        expect(project).not.to.haveOwnProperty('comments')
      })
    })
    expect(hasPopulatedProject, 'expected to test a populated project but never did').to.be.true
  })

  it('should reject an unauthorized request', async () => {
    const res = await request({}, '')
    expect(res).to.have.status(401)
  })

  it('should reject a request with a bad query parameter', async () => {
    const res = await request({ badparam: 'nothing' }, authToken)
    expect(res).to.have.status(400)
  })
})
