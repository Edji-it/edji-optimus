// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'

import { UserAPI, ProjectAPI } from './../../../test/methods'
import data = require('../../../test/constants')
import { iComment } from '../../../models/Comment'

// prep for http calls
chai.use(chaiHttp)
const request = function(body: any, authToken?: string, query?: string): Request {
  let url = '/api/v1/projects'
  if (query) {
    url += `?${query}`
  }
  let req = chai
    .request(data.SERVER)
    .post(url)
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
    let promises = []
    createdProjects.forEach(project => {
      promises.push(ProjectAPI.delete(project._id, authToken))
    })
    await Promise.all(promises)
  })
  it('should create a new project', async () => {
    const res = await request(defaultProject, authToken)
    expect(res).to.have.status(201)
    const project = res.body
    expect(project).to.haveOwnProperty('_id')
    expect(project).to.haveOwnProperty('teacher_id')
    expect(project.teacher_id).to.be.equal(userId)
    expect(project).to.haveOwnProperty('reading_id')
    expect(project).to.haveOwnProperty('label')
    expect(project).to.haveOwnProperty('code')
    expect(project).to.haveOwnProperty('types')
    expect(project).to.haveOwnProperty('temp_ids')
    expect(project).to.haveOwnProperty('students_ids')
    expect(project).to.haveOwnProperty('comments')
    expect(project).to.haveOwnProperty('updatedAt')
    expect(project).to.haveOwnProperty('createdAt')

    createdProjects.push(project)
  })
  it('should create a new project with a learning outcome', async () => {
    const res = await request(outcomeProject, authToken)
    expect(res).to.have.status(201)
    const project = res.body
    expect(project).to.haveOwnProperty('outcomes')
    const outcomes = project.outcomes.map(({ outcome_id, outcome_statement }) => {
      return { outcome_id, outcome_statement }
    })
    expect(outcomes).to.deep.equal(outcomeProject.outcomes)

    createdProjects.push(project)
  })
  it('should let a user copy their comments to a new reading', async () => {
    const createComment = (user_id: string): iComment => {
      return {
        user_id,
        start: Math.round(Math.random() * 10),
        end: Math.round(Math.random() * 10),
      }
    }
    // mix some comments in with the user's comments
    const project1 = await ProjectAPI.create(
      {
        comments: [
          createComment(userId),
          createComment(userId),
          createComment(new ObjectId().toHexString()),
          createComment(userId),
          createComment(new ObjectId().toHexString()),
          createComment(new ObjectId().toHexString()),
        ],
      },
      authToken,
    )
    createdProjects.push(project1)
    const project2 = await request(defaultProject, authToken, `copy_id=${project1._id}`)
    expect(project2).to.have.status(201)
    expect(project2.body).to.haveOwnProperty('comments')
    // make sure only the user's comments are copied
    expect(project2.body.comments).to.be.lengthOf(3)
    project2.body.comments.forEach(comment => {
      expect(comment.user_id).to.be.equal(userId)
    })

    createdProjects.push(project2)
  })
  it('should return "required" errors for all missing fields that are required', async () => {
    const res = await request({ missing: 'everything' }, authToken)
    expect(res).to.have.status(406)
    const error = res.body
    expect(error).to.haveOwnProperty('validationErrors')
    expect(error.validationErrors).to.deep.equal({
      label: 'required',
      reading_id: 'required',
    })
  })
  it('should catch invalid types in `types` array', async () => {
    let project = { ...defaultProject, types: ['not_a_type'] }
    let res = await request(project, authToken)
    expect(res).to.have.status(406)
    let error = res.body
    expect(error).to.haveOwnProperty('validationErrors')
    expect(error.validationErrors).to.deep.equal({ 'types.0': 'enum' })
  })
  it('should reject an unauthorized user', async () => {
    let res = await request(defaultProject)
    expect(res).to.have.status(401)
  })
})
