import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { AES, enc } from 'crypto-js'

import data = require('../../../../test/constants')
import { UserAPI } from './../../../../test/methods'

// data used in tests
let testUserToken: string
let testUserId: string

// prep for http calls
chai.use(chaiHttp)
const requestSetToken = function () {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/users/${testUserId}/tokens/reset_email`)
    .set('Authorization', testUserToken)

  return req
}
const requestUseToken = function (unhashedToken: string, newEmail: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/${testUserId}/tokens/reset_email/${unhashedToken}`)
    .set('Authorization', testUserToken)
    .send({ newEmail: newEmail })
  return req
}

describe('POST api/v1/users/:user_id/tokens/reset_email/:unhashed_token', () => {
  before(async () => {
    let { user, token } = await UserAPI.create()
    testUserToken = token
    testUserId = user._id
  })

  // parameter validation for this route is done by the use-token middleware
  it('should successfully set and then use a token', async function () {
    this.timeout(6000) // set a little bit of a longer timeout, since there are so many calls going on in this test
    let newEmail: string = 'success+email_reset_' + Date.now() + '@simulator.amazonses.com'
    let setTokenRes = await requestSetToken()
    // more explanation on the set-token route logic - we're passed an encrypted version of the token so that we can decrypt it
    //  and make sure we're e2e testing this route w/o using the email sent to the SES inbox
    setTokenRes.should.have.status(200)
    setTokenRes.body.should.have.property('request_id')
    let encryptedToken: string = setTokenRes.body.request_id
    let decryptedToken: string = AES.decrypt(encryptedToken, process.env.OPTIMUS_TOKEN_SIGNING_SECRET).toString(enc.Utf8)
    let useTokenRes = await requestUseToken(decryptedToken, newEmail)
    useTokenRes.should.have.status(204)
  })
})