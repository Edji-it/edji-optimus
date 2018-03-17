// package imports
const chai = require('chai')
const should = chai.should()

// local imports
const helpers = require('./_create')

describe('subscriptions _create helpers', () => {
  it('should have the required properties', () => {
    helpers.should.be.instanceof(Object)
    helpers.should.not.have.property('nothing')

    const propertiesToCheck = [
      'validateBody',
      'retrieveOrCreateCustomer'
    ]

    for(let key of Object.keys(helpers)) {
      propertiesToCheck.indexOf(key).should.be.above(-1)
    }
  })

  describe('validateBody', () => {
    it('should return an object', () => {
      const body = helpers.validateBody({})
      body.should.be.instanceOf(Object)
    })

    // should have all of the valid properties of the body
    const MAX_BODY = {
      subscriptionType: 'yearly',
      couponCode: 'SOME_CODE',
      token: 'some_string'
    }
    it('should be valid when passed with all available parameters', () => {
      const body = helpers.validateBody(MAX_BODY)
      body.should.have.property('error')
      should.not.exist(body.error)
    })

    // has all of the required properties of the request body
    const MVP_BODY = {
      subscriptionType: 'yearly'
    }
    // validate that the MVP_BODY is really the minimum required
    it('should be valid when passed with required parameters', () => {
      const body = helpers.validateBody(MVP_BODY)
      body.should.have.property('error')
      should.not.exist(body.error)
    })

    // validate that each required property will throw an error
    for(let key of Object.keys(MVP_BODY)) {
      let testBody = Object.assign({}, MVP_BODY)
      delete testBody[key]

      it('should have an error when passed without ' + key + ' as a parameter', () => {
        const body = helpers.validateBody(testBody)
        body.should.have.property('error')
        should.exist(body.error)
      })
    }

    // this is so that, if the front end is passing something which is intended to be used but has the incorrect property name,
    //  it will return an error and be caught
    it('should return an error when passed with unnecessary parameters', () => {
      let testBody = Object.assign({
        unnecessary: true
      }, MVP_BODY)
      const body = helpers.validateBody(testBody)
      body.should.have.property('error')
      should.exist(body.error)
    })
  })

  describe('retrieveOrCreateCustomer', () => {

  })
})