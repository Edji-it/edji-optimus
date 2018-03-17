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
    
    let fakeUser = {
      email: 'corbin@edji.it',
      hero: {
        customer_id: 'cus_someid'
      }
    }

    it('should call retrieve from stripes api', () => {
      let retrieveCustomer = sinon.stub(_stripe.api.customers, 'retrieve')
      .callsFake(() => {
        return new Promise((resolve, reject) => { resolve() })
      })
      // retrieveCustomer.calledOnce(retrieveCustomer).should.be.false

      _stripe.retrieveOrCreateCustomer(fakeUser, 'someString')

      // retrieveCustomer.calledOnce(retrieveCustomer).should.be.true
      
      retrieveCustomer.restore()

      sinon.assert.calledOnce(retrieveCustomer)
    })
  })
})