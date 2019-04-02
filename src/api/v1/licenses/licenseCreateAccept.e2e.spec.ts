// library import
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')

// project imports
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const requestCreateLicense = function(authToken?: string) {
  let req = chai
    .request(data.SERVER)
    .post(`/api/v1/licenses/`)
    .send({
      license: {
        license_type: 'hero',
        owning_institution: '5b006d759dbfbf137ec0df23',
        max_users: 10,
        roles: [
          {
            user_id: '59bda04a85c6ab346c12dbbc',
            role: 'owner',
          },
        ],
      },
    })
  authToken && req.set('Authorization', authToken)

  return req
}
const requestInvite = function(licenseId: string, body: { email: string; name: string }, authToken?: string) {
  let { email, name } = body
  let req = chai
    .request(data.SERVER)
    .put(`/api/v1/licenses/${licenseId}/invite`)
    .send({ email, name })
  authToken && req.set('Authorization', authToken)

  return req
}
const requestAccept = function(licenseId: string, authToken?: string) {
  let req = chai.request(data.SERVER).put(`/api/v1/licenses/${licenseId}/accept`)
  authToken && req.set('Authorization', authToken)

  return req
}

describe('license create, add invite, and accept invite success', () => {
  let LICENSE_ID: string
  let INVITE_ID: string
  // before we get too far, we'll need to create a new license to test off of
  it('should add a new license to the collection', async () => {
    const res = await requestCreateLicense(data.LOGIN_TOKENS.API_HERO2)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('license')
    const license = res.body.license
    expect(license).to.haveOwnProperty('_id')
    LICENSE_ID = license._id
  })

  // should add an email address and expiration date to the license
  it('should add email and expiration date to license object upon success', async () => {
    const body = { email: 'optimus@prime.ed', name: 'apitesthero2' }
    const res = await requestInvite(LICENSE_ID, body, data.LOGIN_TOKENS.API_HERO2)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('license')
    const license = res.body.license
    expect(license).to.haveOwnProperty('pending_invitations')

    const pending_invitation = license.pending_invitations[license.pending_invitations.length - 1]
    expect(pending_invitation).to.haveOwnProperty('email')
    expect(pending_invitation).to.haveOwnProperty('expiration')
    expect(pending_invitation.email).to.be.equal(body.email)
    INVITE_ID = pending_invitation._id
  })

  it('should update the user with the new license_id and clear out the email address from the pending_invitation', async () => {
    const res = await requestAccept(INVITE_ID, data.LOGIN_TOKENS.API_HERO2)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('user')
    const user = res.body.user
    expect(user).to.have.haveOwnProperty('license_ids')
    const license_ids = user.license_ids
    expect(license_ids.length).to.be.greaterThan(0)
    const specificLicense = license_ids.find(license => {
      return license.license_id === LICENSE_ID
    })
    expect(specificLicense.license_id).includes(LICENSE_ID)
  })
})
