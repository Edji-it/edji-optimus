// library import
const chai = require('chai')
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
        res.should.not.have.status(200)
        res.should.have.status(401)
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

        res.should.have.status(200)
        res.body.should.have.property('customer')
        res.body.customer.should.have.property('id')
        res.body.customer.id.should.be.equal(HERO_CUSTOMER_ID)

        done()
      })
  })

  it('should receive a 400 if the user is not a Hero', done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(400)

        done()
      })
  })

  it("should receive a 401 if the user's customer_id is not equal to the requested customer_id", done => {
    chai
      .request(TEST.SERVER)
      .get(ENDPOINT_URL + HERO_CUSTOMER_ID) // this is optimusprime's customer id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO)
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(401)

        done()
      })
  })
})
