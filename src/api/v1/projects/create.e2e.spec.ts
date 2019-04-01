// library imports
import 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

import { UserAPI, ProjectAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function(body: any, authToken?: string): Request {
  let req = chai
    .request(data.SERVER)
    .post('/api/v1/projects')
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

const defaultProject = {
  reading_id: '59f91fb776088d0ef0bcea1a',
  label: 'Postman Project',
  types: ['emoji', 'text'],
}
const outcomeProject = {
  reading_id: '59f91fb776088d0ef0bcea1a',
  label: 'Postman Project',
  types: ['emoji', 'text'],
  outcomes: [
    {
      outcome_id: '5c50f4c20b944f00963beb59',
      outcome_statement: 'Statement',
    },
  ],
}

let authToken: string
let userId: any
let createdProjects: any[] = []

describe('POST /api/v1/projects', () => {
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_TEACHER
    let { user, token } = await UserAPI.login(username, password)
    authToken = token
    userId = user._id
  })
  after(async () => {
    createdProjects.forEach(async project => {
      let status = await ProjectAPI.delete(project._id, authToken)
      status.should.be.equal(204)
    })
  })

  it('should create a new project', async () => {
    const res = await request(defaultProject, authToken)
    res.should.have.status(201)
    const project = res.body
    project.should.have.property('_id')
    project.should.have.property('teacher_id')
    project.teacher_id.should.equal(userId)
    project.should.have.property('reading_id')
    project.should.have.property('label')
    project.should.have.property('code')
    project.should.have.property('types')
    project.should.have.property('temp_ids')
    project.should.have.property('students_ids')
    project.should.have.property('comments')
    project.should.have.property('updatedAt')
    project.should.have.property('createdAt')

    createdProjects.push(project)
  })
  it('should create a new project with a learning outcome', async () => {
    const res = await request(outcomeProject, authToken)
    res.should.have.status(201)
    const project = res.body
    project.should.have.property('_id')
    project.should.have.property('teacher_id')
    project.teacher_id.should.equal(userId)
    project.should.have.property('reading_id')
    project.should.have.property('label')
    project.should.have.property('code')
    project.should.have.property('types')
    project.should.have.property('temp_ids')
    project.should.have.property('students_ids')
    project.should.have.property('comments')
    project.should.have.property('updatedAt')
    project.should.have.property('createdAt')
    project.should.have.property('outcomes')
    const outcomes = project.outcomes[0]
    outcomes.should.have.property('outcome_id')
    outcomes.should.have.property('outcome_statement')

    createdProjects.push(project)
  })
  it("should return 'required' errors for all missing fields that are required", async () => {
    const res = await request({ missing: 'everything' }, authToken)
    res.should.have.status(406)
    const error = res.body
    error.should.have.property('validationErrors')
    error.validationErrors.should.have.property('label')
    error.validationErrors.label.should.equal('required')
    error.validationErrors.should.have.property('reading_id')
    error.validationErrors.reading_id.should.equal('required')
  })
  it('should catch invalid types in `types` array', async () => {
    let project = { ...defaultProject, types: ['not_a_type'] }
    let res = await request(project, authToken)
    res.should.have.status(406)
    let error = res.body
    error.should.have.property('validationErrors')
    error.validationErrors.should.have.property('types.0')
    error.validationErrors['types.0'].should.equal('enum')
  })
  it('should reject an unauthorized user', async () => {
    let res = await request(defaultProject)
    res.should.have.status(401)
  })
})
