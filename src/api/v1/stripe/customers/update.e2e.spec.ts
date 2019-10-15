// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))
import { Request } from 'superagent'

// project imports
import { UserAPI } from '../../../../test/methods'
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/customers/'
const HERO_CUSTOMER_ID = 'cus_CY7dBlTnqRV2i5'
const HERO_CUSTOMER_ID2 = 'cus_CsiQqTI3tCnrKq'
const token = 'src_1FR74WGXFrmoasogdoEIFiO6'

const request = function(customerId: string, body?: any, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .put(`${ENDPOINT_URL}/${customerId}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('PUT /stripe/customers/:stripe_id', () => {
  it('should get a 401 without auth', async () => {
    const update = {
      token: token,
    }
    const res = await request(HERO_CUSTOMER_ID, update)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(401)
  })

  it('should get a 400 when token property on body is missing', async () => {
    const res = await request(HERO_CUSTOMER_ID, {}, TEST.LOGIN_TOKENS.API_HERO2)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(400)
  })

  it('should get a 400 for a user that is not a stripe customer', async () => {
    const update = {
      token: token,
    }
    const res = await request(HERO_CUSTOMER_ID, update, TEST.LOGIN_TOKENS.API_STUDENT)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(400)
  })

  it('should get a 400 for a request that is missing the customer_id', async () => {
    const update = {
      token: token,
    }
    const res = await request('f', update, TEST.LOGIN_TOKENS.API_HERO2)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(400)
  })

  it('should get a 401 for a user customer_id that does not match the customer_id passed in', async () => {
    const update = {
      token: token,
    }
    const res = await request(HERO_CUSTOMER_ID2, update, TEST.LOGIN_TOKENS.API_HERO2)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(401)
  })
})
