// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/customers/'
const HERO_CUSTOMER_ID = 'cus_CY7dBlTnqRV2i5'

describe('GET /stripe/customers/:customer_id', () => {
  it('should get a 401 without auth', done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)
        done()
      })
  })

  it('should return a customer by id', done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('customer')
        expect(res.body.customer).to.have.property('id')
        expect(res.body.customer.id).to.equal(HERO_CUSTOMER_ID)

        done()
      })
  })

  it('should receive a 400 if the user is not a Hero', done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(400)

        done()
      })
  })

  it("should receive a 401 if the user's customer_id is not equal to the requested customer_id", done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)

        done()
      })
  })
})
