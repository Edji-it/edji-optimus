// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/customers/'
const HERO_CUSTOMER_ID = 'cus_CY7dBlTnqRV2i5'
const HERO_CUSTOMER_ID2 = 'cus_CsiQqTI3tCnrKq'

describe('GET /stripe/customers/:stripe_id/card', () => {
  it('should return default card info by customer id', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}/${HERO_CUSTOMER_ID}/card`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('card')
        expect(res.body.card).to.have.property('id')
        expect(res.body.card).to.have.property('brand')
        expect(res.body.card).to.have.property('customer')
        expect(res.body.card.customer).to.equal(HERO_CUSTOMER_ID)

        done()
      })
  })

  it('should get a 401 without auth', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}/${HERO_CUSTOMER_ID}/card`)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)
        done()
      })
  })

  it('should get a 400 for a user that is not a stripe customer', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}/${HERO_CUSTOMER_ID}/card`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(400)
        done()
      })
  })

  it('should get a 400 for a request that is missing the customer_id', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}/f/card`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(400)
        done()
      })
  })

  it('should get a 401 for a user customer_id that does not match the customer_id passed in', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}/${HERO_CUSTOMER_ID2}/card`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)
        done()
      })
  })
})
