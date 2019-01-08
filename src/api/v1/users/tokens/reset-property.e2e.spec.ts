import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { AES, enc } from 'crypto-js'

import data = require('../../../../test/constants')
import { UserAPI } from '../../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const requestSetToken = function (userId: string, propertyName: string, authToken: string) {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/users/${userId}/tokens/${propertyName}`)
    .set('Authorization', authToken)

  return req
}
const requestUseToken = function (userId: string, unhashedToken: string, propertyName: string, propertyValue: string, authToken: string) {
  let req = chai.request(data.SERVER)
    .post(`/api/v1/users/${userId}/tokens/${propertyName}/${unhashedToken}`)
    .set('Authorization', authToken)
    .send({ [propertyName]: propertyValue })
  return req
}

const validateUseToken = async function (userId: string, propertyName: string, propertyValue: string, authToken: string) {
  let setTokenRes = await requestSetToken(userId, propertyName, authToken)
  // more explanation on the set-token route logic - we're passed an encrypted version of the token so that we can decrypt it
  //  and make sure we're e2e testing this route w/o using the email sent to the SES inbox
  setTokenRes.should.have.status(200)
  setTokenRes.body.should.have.property('request_id')
  let encryptedToken: string = setTokenRes.body.request_id
  let decryptedToken: string = AES.decrypt(encryptedToken, process.env.OPTIMUS_TOKEN_SIGNING_SECRET).toString(enc.Utf8)
  let useTokenRes1 = await requestUseToken(userId, decryptedToken, propertyName, propertyValue, authToken)
  useTokenRes1.should.have.status(204)
  let useTokenRes2 = await requestUseToken(userId, decryptedToken, propertyName, propertyValue, authToken)
  useTokenRes2.should.have.status(400) // make sure the token is deleted and we can't use it twice
}

describe('POST api/v1/users/:user_id/tokens/:reset_property/:unhashed_token', () => {
  // data used in tests
  let testToken: string
  let testUser: any
  let credentials: { username: string, password: string }
  before(async () => {
    let obj = await UserAPI.create({ email: `success+reset${Date.now()}@simulator.amazonses.com` }, { returnCreds: true })
    testUser = obj.user
    testToken = obj.token
    credentials = obj.credentials
  })
  it('should reset email', async () => {
    await validateUseToken(testUser._id, 'email', `success+reset2${Date.now()}@simulator.amazonses.com`, testToken)
    let loginRes = await UserAPI.login(credentials.username, credentials.password, { returnRoot: true })
    loginRes.should.have.status(200)
  })
  it('should reset password', async () => {
    let newPass: string = Date.now().toString()
    await validateUseToken(testUser._id, 'password', newPass, testToken)
    let loginRes = await UserAPI.login(testUser.username, newPass, { returnRoot: true })
    loginRes.should.have.status(200)
  })
})