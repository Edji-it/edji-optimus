// library import
import * as chai from 'chai'
import { expect } from 'chai'
chai.use(require('chai-http'))

// project imports
const TEST = require('../../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/stripe/subscriptions/'

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
