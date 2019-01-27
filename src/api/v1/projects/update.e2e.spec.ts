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
    projectState = project // make sure projectState is consistent with the database after every test
  })
  after(async () => {
    const status = await ProjectAPI.delete(projectState._id, authToken) // clean it up
    expect(status, 'test project deletion failed').to.be.equal(204)
  })
  it('should update a single property', async () => {
    const initialValue = projectState.heat_vision
    const res = await request(projectState._id, { heat_vision: !initialValue }, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.have.property('heat_vision')
    expect(res.body.heat_vision).not.to.be.equal(initialValue)
  })
  it('should return the state of all updatable properties', async () => {
    const expectedUpdatable = ['heat_vision', 'tags', 'report_evals']
    const res = await request(projectState._id, projectState, authToken)
    expect(res).to.have.status(200)
    const returnedUpdated = Object.keys(res.body)
    returnedUpdated.forEach((key) => {
      expect(expectedUpdatable.includes(key), `expected not to be able to update ${key}, but the key was returned from update endpoint`).to.be.true
    })
    expectedUpdatable.forEach((key) => [
      expect(returnedUpdated.includes(key), `expected to be able to update ${key}, but the key was not returned from update endpoint`).to.be.true
    ])
  })
  it('should return 400 if the request does not send any properties to update', async () => {
    const res = await request(projectState._id, {}, authToken)
    expect(res).to.have.status(400)
  })
  it('should return 400 if the request is not attempting to update any updatable properties', async () => {
    const res = await request(projectState._id, { non_esiste: 'this doesnt exist bro' }, authToken)
    expect(res).to.have.status(400)
  })
  it('should reject an unauthorized request', async () => {
    const res = await request(projectState._id, { heat_vision: true })
    expect(res).to.have.status(401)
  })
  it('should return 404 if requesting to update a project which does not exist', async () => {
    const res = await request(userId, { heat_vision: true }, authToken)
    expect(res).to.have.status(404)
  })
  it('should return 404 if the user is attempting to update a real project which they do not own', async () => {
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token } = await UserAPI.login(username, password)
    expect(token).not.to.be.undefined
    const res = await request(projectState._id, { heat_vision: true }, token)
    expect(res).to.have.status(404)
  })
})