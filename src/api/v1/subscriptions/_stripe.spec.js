// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')

// project imports
const _stripe = require('./_stripe')

describe('_stripe', () => {
  it('should have the required properties', () => {
    _stripe.should.be.instanceof(Object)
    _stripe.should.not.have.property('nothing')

    const propertiesToCheck = [
      'api',
      'retrieveOrCreateCustomer'
    ]

    for(let key of Object.keys(_stripe)) {
      propertiesToCheck.indexOf(key).should.be.above(-1)
    }
  })

  // describe('getCustomer', () => {
  //   it('should return a promise', (done) => {
  //     _stripe.getCustomer()
  //   })
  // })
  describe('retrieveOrCreateCustomer', () => {
    let createCustomer = sinon.stub(_stripe.api.customers, 'create')

    it('should return a promise', () => {

    })

    createCustomer.restore()
  })
})