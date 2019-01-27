// library imports
import 'mocha'
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

import { UserAPI, ProjectAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const request = function (projectId: string, body: any, authToken?: string): Request {
  let req = chai.request(data.SERVER)
    .put(`/api/v1/projects/${projectId}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let userId: any
let projectState: any // keep track of the updates we make to the project along the way

describe("PUT /api/v1/projects/:project_id", () => {
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_TEACHER
    let { user, token } = await UserAPI.login(username, password)
    expect(token).not.to.be.undefined
    expect(user, 'did not successfully log in user').not.to.be.undefined
    authToken = token
    userId = user._id
  })
  before(async () => {
    const { project } = await ProjectAPI.create({
      teacher_id: userId,
      reading_id: '59bda04985c6ab346c12dbba', // this is not a real project id
      label: 'PUT /api/v1/projects/:project_id test project'
    },
      authToken
    )
    expect(project._id, 'did not successfully create project to test').not.to.be.undefined
    projectState = project
  })
  afterEach(async () => {
    const { project } = await ProjectAPI.retrieve(projectState._id, authToken)
    expect(project._id).to.be.equal(projectState._id) // just verify we got back the project we expected
    projectState = project // update projectState 
  })
  after(async () => {
    const status = await ProjectAPI.delete(projectState._id, authToken)
    expect(status, 'test project deletion failed').to.be.equal(204)
  })
  it('should update a single property', async () => {
    const initialValue = projectState.heat_vision
    const res = await request(projectState._id, { heat_vision: !initialValue }, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.have.property('heat_vision')
    expect(res.body.heat_vision).not.to.be.equal(initialValue)
  })
})