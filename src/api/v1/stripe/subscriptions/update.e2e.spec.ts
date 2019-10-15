// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))
import { Request } from 'superagent'

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/subscriptions'
const HERO_SUBSCRIPTION_ID = 'sub_DzYCtQK4fzNhYY'

const request = function(subscriptionId: string, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .put(`${ENDPOINT_URL}/${subscriptionId}`)
    .send()

  authToken && req.set('Authorization', authToken)
  return req
}

describe('PUT /stripe/subscriptions/:subscription_id', () => {
  it('should get a 401 without auth', async () => {
    const res = await request(HERO_SUBSCRIPTION_ID)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(401)
  })

  it('should get a 400 when subscription_id is missing', async () => {
    const res = await request('f', TEST.LOGIN_TOKENS.API_HERO2)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(400)
  })
})
