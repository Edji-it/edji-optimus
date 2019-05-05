// library import
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
chai.use(chaiHttp)
import { Request } from 'superagent'

// project imports
import { UserAPI } from './../../../test/methods'
import * as data from './../../../test/constants'

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

const request = function(authToken?: string): Request {
  let url = '/api/v1/licenses/'
  let req = chai.request(data.SERVER).get(url)

  authToken && req.set('Authorization', authToken)
  return req
}

let teacherToken
let studentToken

describe('GET /api/v1/licenses/', () => {
  before(async () => {
    const { API_HERO2: teacherCreds, API_STUDENT: studentCreds } = data.LOGIN_INFO
    const { token: tToken } = await UserAPI.login(teacherCreds.username, teacherCreds.password)
    const { token: sToken } = await UserAPI.login(studentCreds.username, studentCreds.password)
    teacherToken = tToken
    studentToken = sToken
  })
  it('should GET all licenses for the test user', async function() {
    this.timeout(6000)
    const res = await request(teacherToken)
    expect(res).to.have.status(200)

    expect(res.body).to.haveOwnProperty('licenses')
    const licenses = res.body.licenses
    expect(licenses).to.be.instanceOf(Array)
    expect(licenses).length.above(0)

    let heroLicense = licenses.find(license => {
      return license.license_type === 'hero'
    })
    expect(heroLicense).to.exist
    expect(heroLicense).to.haveOwnProperty('_id')
    expect(heroLicense).to.haveOwnProperty('max_users')
    expect(heroLicense.max_users).to.be.above(0)
    expect(heroLicense).to.haveOwnProperty('pending_invitations')
    expect(heroLicense.pending_invitations).to.be.instanceOf(Array)
    expect(heroLicense).to.haveOwnProperty('roles')
    expect(heroLicense).to.haveOwnProperty('owning_institution')
    expect(heroLicense).to.haveOwnProperty('users')
    expect(heroLicense.users).to.be.instanceOf(Array)
    expect(heroLicense.users).length.above(0)
    expect(heroLicense).to.haveOwnProperty('createdAt')
    expect(heroLicense).to.haveOwnProperty('updatedAt')

    const firstUser = heroLicense.users[0]
    expect(firstUser).to.haveOwnProperty('_id')
    expect(firstUser).to.haveOwnProperty('username')
    expect(firstUser).to.haveOwnProperty('fullname')
    expect(firstUser).to.haveOwnProperty('email')
    expect(firstUser).to.haveOwnProperty('identities')
    expect(firstUser).to.haveOwnProperty('hero_status')
    expect(firstUser).to.haveOwnProperty('license_ids')
    expect(firstUser).to.haveOwnProperty('institution_ids')
    expect(firstUser).to.haveOwnProperty('updatedAt')
    expect(firstUser).to.haveOwnProperty('createdAt')
  })
  it('should not get any licenses for a student', async () => {
    const res = await request(studentToken)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('licenses')
    res.body.licenses.length.should.be.equal(0)
    expect(res.body.licenses).to.have.lengthOf(0)
  })
  it('should be rejected with an unauthorized request', async () => {
    const res = await request()
    expect(res).to.have.status(401)
  })
})
