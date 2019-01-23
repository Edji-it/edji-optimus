// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import data = require('../../../test/constants')
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const request = function (type: string, { token, pop }: { token?: string, pop?: string } = {}): Request {
  let url = `/api/v1/readings/${type}?`
  pop && (url += `pop=${pop}`)
  let req = chai.request(data.SERVER)
    .get(url)

  token && req.set('Authorization', token)
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
    let res = await request('nothing', { token })
    res.should.have.status(400)
  })
  it('should return multiple drafts', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)

    let res = await request('draft', { token })
    res.should.have.status(200)
    res.body.should.have.property('readings')
    res.body.readings.should.be.instanceOf(Array)
    res.body.readings.length.should.be.above(1)
    res.body.readings.forEach((reading) => {
      reading.should.have.property('_id')
      reading.owner_id.should.be.equal(user._id.toString())
      reading.should.have.property('owner_id')
      reading.should.have.property('title')
      reading.should.have.property('createdAt')
      reading.should.have.property('updatedAt')
      reading.should.have.property('draft')
      reading.draft.should.be.true

      // things the reading should NOT have
      reading.should.not.have.property('words')
      reading.should.not.have.property('html')
      reading.should.not.have.property('projects')
    })
  })
  it('should return bookmarked readings', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)

    let res = await request('owner_bookmarked', { token })
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
      reading.should.not.have.property('projects')
    })
  })
  it('should populate projects', async () => {
    let { user, token } = await loginUser(data.LOGIN_INFO.API_TEACHER)
    let res = await request('owner_bookmarked', { token, pop: 'projects' })
    res.should.have.status(200)
    res.body.should.have.property('readings')
    res.body.readings.should.be.instanceOf(Array)
    res.body.readings.length.should.be.above(1)

    let hasPopulatedProject: boolean = false
    res.body.readings.forEach((reading) => {
      reading.should.have.property('projects')
      reading.projects.should.be.instanceOf(Array)
      reading.projects.forEach((project) => {
        hasPopulatedProject = true
        project.should.have.property('_id')
        project.should.have.property('reading_id')
        project.should.have.property('teacher_id')
        project.should.have.property('label')
        project.should.have.property('code')
        project.should.have.property('types')
        project.should.have.property('createdAt')
        project.should.have.property('updatedAt')
        project.should.have.property('students_ids')
        project.should.have.property('comment_count')
        project.should.have.property('student_count')

        project.should.not.have.property('comments')
      })
    })
    hasPopulatedProject.should.be.equal(true, 'never found a populated project')
  })
})