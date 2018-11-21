import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { AES, enc } from 'crypto-js'
import data = require('./../../../../../_test')

// setup test data
const testUserToken: string = data.LOGIN_TOKENS.API_EMAIL_SUCCESS
const testUserId: string = data.LOGIN_INFO.API_EMAIL_SUCCESS._id

// prep for http calls
chai.use(chaiHttp)
const requestSetToken = function () {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/users/${testUserId}/tokens/reset_email`)
    .set('Authorization', testUserToken)

  return req
}
const requestUseToken = function (unhashedToken: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/${testUserId}/tokens/reset_email/${unhashedToken}`)
    .set('Authorization', testUserToken)
  return req
}

describe('POST api/v1/users/:user_id/tokens/reset_email/:unhashed_token', () => {
  // parameter validation for this route is done by the use-token middleware
  it('should successfully set and then use a token', async () => {
    let setTokenRes = await requestSetToken()
    // more explanation on the set-token route logic - we're passed an encrypted version of the token so that we can decrypt it
    //  and make sure we're e2e testing this route w/o using the email sent to the SES inbox
    let encryptedToken: string = setTokenRes.body.requestId
    let decryptedToken: string = AES.decrypt(encryptedToken, process.env.OPTIMUS_TOKEN_SIGNING_SECRET).toString(enc.Utf8)
    let useTokenRes = await requestUseToken(decryptedToken)
    useTokenRes.should.have.status(200)
  })
})