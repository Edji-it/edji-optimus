// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))
import { Request } from 'superagent'

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/subscriptions/'
const token = 'src_1FR74WGXFrmoasogdoEIFiO6'

const request = function(body: any, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .post(`${ENDPOINT_URL}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('POST /stripe/subscriptions', () => {
  const body = {
    token: token,
  }
  it('should get a 401 without auth', async () => {
    const res = await request(body)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(401)
  })

  it('should get a 400 when token in body is missing', async () => {
    const res = await request({}, TEST.LOGIN_TOKENS.API_HERO2)
    expect(res).to.not.have.status(200)
    expect(res).to.have.status(400)
  })
})

describe('DELETE /stripe/subscriptions', () => {
  it('should get a 401 without auth', done => {
    chai
      .request(TEST.SERVER)
      .del(`${ENDPOINT_URL}`)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)
        done()
      })
  })

  it('should get a 400 for a user that is not a stripe customer', done => {
    chai
      .request(TEST.SERVER)
      .del(`${ENDPOINT_URL}`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(400)
        done()
      })
  })
})

describe('create a user and create, delete, and rejoin subscription', () => {
  it('should create a new Edji user', done => {})

  it('should create a new customer and subscription for Edji user', done => {})

  it('should update a customers credit card', done => {})

  it('should delete a subsscription', done => {})

  it('should rejoin a subscription', done => {})
})
