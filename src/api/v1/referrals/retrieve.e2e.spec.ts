// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))

// project imports
const data = require('../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/referrals'

describe('GET /api/v1/referrals/:referral_code', () => {
  it('should get a users fullname without authentication', async () => {
    let requestCode = 'ct8zh'
    const res = await chai.request(data.SERVER).get(ENDPOINT_URL + '/' + requestCode)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('user')
    const user = res.body.user
    const propertiesToCheck = ['fullname']
    // make sure that more properties than intended are not being returned
    for (let key in user) {
      expect(propertiesToCheck).to.include(key)
    }
  })
})
