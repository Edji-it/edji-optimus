// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/subscriptions/'

describe('GET /stripe/subscriptions', () => {
  it('should get a 401 without auth', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}`)
      .end((err, res) => {
        expect(res).to.not.have.status(200)
        expect(res).to.have.status(401)
        done()
      })
  })

  it('should get a 200 with an empty response for a user that is not a stripe customer', done => {
    chai
      .request(TEST.SERVER)
      .get(`${ENDPOINT_URL}`)
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        expect(res).to.not.have.status(400)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('subscriptions')
        expect(res.body.subscriptions).to.be.an('array').that.is.empty
        done()
      })
  })
})
