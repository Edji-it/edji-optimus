import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI, ProjectAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(project_id: string, authToken?: string) {
  let req = chai.request(data.SERVER).del(`/api/v1/projects/${project_id}`)

  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string

describe('DELETE /api/v1/projects/:project_id', () => {
  before(async () => {
    const { username: createReadingUsername, password: createReadingPassword } = data.LOGIN_INFO.API_TEACHER
    let userRes = await UserAPI.login(createReadingUsername, createReadingPassword)
    authToken = userRes.token
  })
  it('should delete a project', async () => {
    const project = await ProjectAPI.create({}, authToken)
    const res = await request(project._id, authToken)
<<<<<<< HEAD
    expect(res).to.have.status(204)
    // verify we can't, in fact, go get that reading now
    const { _id: deletedProjecId } = await ProjectAPI.retrieve(project._id, authToken)
    expect(deletedProjecId).to.be.undefined
=======
    expect(res).to.have.status(200)
    expect(res.body).to.eql({
      deleted: 1,
    })
>>>>>>> refactor project delete
  })
  it('should receive a 400 if passed an invalid project id', async () => {
    const res = await request('invalid_id', authToken)
    expect(res).to.have.status(400)
  })
  it('should reject an unauthorized request', async () => {
    const res = await request('invalid_id')
    expect(res).to.have.status(401)
  })
  it('should return 404 if requesting to delete a project which does not exist', async () => {
    const res = await request('59bda04985c6ab346c12dbba', authToken)
    expect(res).to.have.status(404)
  })
  it('should return 404 if the user is attempting to delete a real project which they do not own', async () => {
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token } = await UserAPI.login(username, password)
    expect(token).not.to.be.undefined
    const project = await ProjectAPI.create({}, authToken)
    const res = await request(project._id, token)
    expect(res).to.have.status(404)
  })
})
