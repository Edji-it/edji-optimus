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
  // it('should get a 401 without auth', done => {
  //   chai
  //     .request(TEST.SERVER)
  //     .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
  //     .end((err, res) => {
  //       expect(res).to.not.have.status(200)
  //       expect(res).to.have.status(401)
  //       done()
  //     })
  // })
})
