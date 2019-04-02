import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI, ProjectAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(reading_id: string, authToken?: string) {
  let req = chai.request(data.SERVER).del(`/api/v1/readings/${reading_id}`)

  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let ownerId: string

describe('DELETE /api/v1/readings/:reading_id', () => {
  before(async () => {
    const { username: createReadingUsername, password: createReadingPassword } = data.LOGIN_INFO.API_TEACHER
    let userRes = await UserAPI.login(createReadingUsername, createReadingPassword)
    authToken = userRes.token
    ownerId = userRes.user._id
  })
  it('should delete a reading', async () => {
    const { reading } = await ReadingAPI.create(authToken)
    const res = await request(reading._id, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.eql({
      readings_deleted: 1,
      projects_deleted: 0,
      versions_updated: 1,
      search_deleted: true,
    })
  })
  it('should delete all projects associated with a reading', async () => {
    const { reading } = await ReadingAPI.create(authToken)
    // create two new projects which belong to the reading
    await ProjectAPI.create(
      {
        reading_id: reading._id,
        teacher_id: ownerId,
        label: 'test delete',
      },
      authToken,
    )
    await ProjectAPI.create(
      {
        reading_id: reading._id,
        teacher_id: ownerId,
        label: 'test delete',
      },
      authToken,
    )
    const res = await request(reading._id, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.eql({
      readings_deleted: 1,
      projects_deleted: 2,
      versions_updated: 1,
      search_deleted: true,
    })
  })
  it('should return 404 for a reading that does not exist', async () => {
    const res = await request(ownerId, authToken)
    expect(res).to.have.status(404)
  })
  it('should return a 400 if the reading id is not valid', async () => {
    const res = await request('12345', authToken)
    expect(res).to.have.status(400)
  })
  it('should reject a request without an auth header', async () => {
    const res = await request('12345')
    expect(res).to.have.status(401)
  })
})
