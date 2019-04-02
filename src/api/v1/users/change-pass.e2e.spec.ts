// library imports
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import { UserAPI } from './../../../test/methods'
import data = require('../../../test/constants')

chai.use(chaiHttp)

const request = function (body: any, authToken?: string): Request {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/@me/change_password`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

let createdUser: any
let createdUserToken: string
let createdUserCreds: { username: string, password: string }

describe('POST /api/v1/users/@me/change_password', () => {
  before(async () => {
    const { user, token, credentials } = await UserAPI.create({}, { returnCreds: true })
    createdUserToken = token
    createdUser = user
    createdUserCreds = credentials
  })
  it('should successfully change a password', async () => {
    const new_password = 'hello there'
    const res = await request({ old_password: createdUserCreds.password, new_password }, createdUserToken)
    // verify that you can log in with the new password
    await UserAPI.login(createdUser.username, new_password)
    createdUserCreds.password = new_password
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('token')
    expect(res.body).to.haveOwnProperty('user')
  })
  it('should return a 400 if old_password is not sent', async () => {
    const res = await request({ new_password: 'muffin' }, createdUserToken)
    expect(res).to.have.status(400)
  })
  it('should return a 400 if new_password is not sent', async () => {
    const res = await request({ old_password: 'muffin' }, createdUserToken)
    expect(res).to.have.status(400)
  })
  it('should return a 401 if no authorization is provided', async () => {
    const res = await request({ old_password: createdUserCreds.password, new_password: 'some pass' })
    expect(res).to.have.status(401)
  })
  it('should return a 403 if the old passwords do not match', async () => {
    const res = await request({ old_password: 'this should not pass as the password', new_password: 'crazy new pass' }, createdUserToken)
    expect(res).to.have.status(403)
  })
})