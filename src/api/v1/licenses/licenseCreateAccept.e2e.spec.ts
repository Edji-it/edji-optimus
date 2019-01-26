// library import
import * as chai from 'chai'
import chaiHttp = require('chai-http')

// project imports
import data = require('../../../test/constants')
// import { UserAPI } from '../../../../test/methods'


// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

// prep for http calls
chai.use(chaiHttp)
const requestCreateLicense = function (authToken?: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/licenses/`)
    .send({
      license: {
        license_type: "hero",
        owning_institution: "5b006d759dbfbf137ec0df23",
        max_users: 10,
        roles: [
          {
            user_id: "59bda04a85c6ab346c12dbbc",
            role: "owner"
          }
        ]
      }
    })
  authToken && req.set('Authorization', authToken)

  return req
}
const requestInvite = function (licenseId: string, body: { email: string, name: string }, authToken?: string) {
  let { email, name } = body
  let req = chai.request(data.SERVER)
    .put(`/api/v1/licenses/${licenseId}/invite`)
    .send({ email, name })
  authToken && req.set('Authorization', authToken)

  return req
}
const requestAccept = function (licenseId: string, authToken?: string) {
  let req = chai.request(data.SERVER)
    .put(`/api/v1/licenses/${licenseId}/accept`)
  authToken && req.set('Authorization', authToken)

  return req
}

describe('license create, add invite, and accept invite success', () => {
  let LICENSE_ID: string
  let INVITE_ID: string
  // before we get too far, we'll need to create a new license to test off of
  it('should add a new license to the collection', async () => {
    let res = await requestCreateLicense(data.LOGIN_TOKENS.API_HERO2)
    res.should.have.status(200)
    res.body.should.have.property('license')
    let license = res.body.license
    license.should.have.property('_id')
    LICENSE_ID = license._id
  })

  // should add an email address and expiration date to the license
  it('should add email and expiration date to license object upon success', async () => {
    let body = { email: 'optimus@prime.ed', name: "apitesthero2" }
    let res = await requestInvite(LICENSE_ID, body, data.LOGIN_TOKENS.API_HERO2)
    res.should.have.status(200)
    res.body.should.have.property('license')
    let license = res.body.license
    license.should.have.property('pending_invitations')
    let pending_invitation = license.pending_invitations[license.pending_invitations.length - 1]
    pending_invitation.should.have.property('email')
    pending_invitation.should.have.property('expiration')
    pending_invitation.email.should.be.equal(body.email)
    INVITE_ID = pending_invitation._id
  })

  it('should update the user with the new license_id and clear out the email address from the pending_invitation', async () => {
    let res = await requestAccept(INVITE_ID, data.LOGIN_TOKENS.API_HERO2)
    res.should.have.status(200)
    res.body.should.have.property('user')
    let user = res.body.user
    user.should.have.property('license_ids')
    let license_ids = user.license_ids
    license_ids.should.have.length.above(0)
    let specificLicense = license_ids.find((license) => {
      return license.license_id === LICENSE_ID
    })
    specificLicense.license_id.should.include(LICENSE_ID)
  })
})