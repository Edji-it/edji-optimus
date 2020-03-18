// library import
import * as chai from 'chai'
import { expect, assert } from 'chai'
chai.use(require('chai-http'))
import { Request } from 'superagent'

// project imports
const TEST = require('../../../../test/constants')
import { UserAPI } from '../../../../test/methods'
import { retrieveOrCreateCustomer, createStripeSubscription } from '../../../../services/stripe'

// local variables
const ENDPOINT_URL = '/api/v1/stripe/subscriptions/'
const STRIPE_PAYMENT_TOKEN_VISA = 'tok_visa'
const STRIPE_PAYMENT_TOKEN_AMEX = 'tok_amex'

const requestCreateSub = function(body: any, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .post(`${ENDPOINT_URL}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

const requestUpdateCard = function(subscriptionId: string, body?: any, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .put(`${ENDPOINT_URL}/${subscriptionId}`)
    .send(body)

  authToken && req.set('Authorization', authToken)
  return req
}

const requestRejoinSub = function(subscriptionId: string, authToken?: string): Request {
  let req = chai
    .request(TEST.SERVER)
    .put(`${ENDPOINT_URL}/${subscriptionId}`)
    .send()

  authToken && req.set('Authorization', authToken)
  return req
}

describe('stripe services', () => {
  describe('POST /stripe/subscriptions', () => {
    const body = {
      token: STRIPE_PAYMENT_TOKEN_VISA,
    }
    it('should get a 401 without auth', async () => {
      const res = await requestCreateSub(body)
      expect(res).to.not.have.status(200)
      expect(res).to.have.status(401)
    })

    it('should get a 400 when token in body is missing', async () => {
      const res = await requestCreateSub({}, TEST.LOGIN_TOKENS.API_HERO2)
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
    let createdUserToken: string
    let customerId: string
    let subscriptionId: string

    before(async () => {
      const { token } = await UserAPI.create({}, { returnCreds: true })

      // Set these for reference later in testing
      createdUserToken = token
    })

    it('should create a new customer and subscription for Edji user', async function() {
      this.timeout(6000)
      const body = {
        token: STRIPE_PAYMENT_TOKEN_VISA,
      }

      // validate response
      const res = await requestCreateSub(body, createdUserToken)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('subscription')
      expect(res.body).to.have.property('user')
      const user = res.body.user
      expect(user).to.have.property('stripe_customer_id')
      expect(user.stripe_customer_id).to.be.a('string')

      // Set these for reference later in testing
      customerId = user.stripe_customer_id
      subscriptionId = res.body.subscription.id
    })

    it('should update a customers credit card', async () => {
      const update = {
        token: STRIPE_PAYMENT_TOKEN_AMEX,
      }
      const res = await requestUpdateCard(subscriptionId, update, createdUserToken)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('user')
      const user = res.body.user
      expect(user)
        .to.have.property('stripe_customer_id')
        .and.be.a('string')
      expect(user.stripe_customer_id).to.be.a('string')
    })

    it('should delete a subscription', done => {
      chai
        .request(TEST.SERVER)
        .del(`${ENDPOINT_URL}`)
        .set('Authorization', createdUserToken)
        .end((err, res) => {
          // console.log(res.error)
          expect(res).to.have.status(200)
          expect(res.body).to.have.property('canceled')
          expect(res.body.canceled).to.be.true // or false
          assert.equal(res.body.canceled, true)
          done()
        })
    })

    it('should rejoin a subscription', async () => {
      const res = await requestRejoinSub(subscriptionId, createdUserToken)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('user')
      const user = res.body.user
      expect(user).to.have.property('stripe_customer_id')
      expect(user.stripe_customer_id).to.be.a('string')
    })
  })
})
