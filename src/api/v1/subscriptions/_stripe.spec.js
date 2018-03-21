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
      },
      fullanme: 'corbin'
    }

    it('should call retrieve from stripes api', (done) => {
      // stub these functions
      let retrieveCustomer = sinon.stub(_stripe.api.customers, 'retrieve').resolves()
      let createCustomer = sinon.stub(_stripe.api.customers, 'create').resolves()

      // unit under test
      _stripe.retrieveOrCreateCustomer(fakeUser, 'someString')
      
      // restore stubs
      retrieveCustomer.restore()
      createCustomer.restore()

      // assertions
      sinon.assert.calledOnce(retrieveCustomer)
      sinon.assert.calledWith(retrieveCustomer, fakeUser.hero.customer_id)
      sinon.assert.notCalled(createCustomer)
      
      done()
    })
  })

  it('should call create from stripes api', (done) => {
    let sentUser = {
      fullname: 'corbin',
      email: 'corbin@edji.it'
    }

    // stub these functions
    let retrieveCustomer = sinon.stub(_stripe.api.customers, 'retrieve').resolves()
    let createCustomer = sinon.stub(_stripe.api.customers, 'create').resolves()

    // unit under test
    _stripe.retrieveOrCreateCustomer(sentUser, 'someString')
    
    // restore stubs
    retrieveCustomer.restore()
    createCustomer.restore()

    // assertions
    sinon.assert.calledOnce(createCustomer)
    sinon.assert.notCalled(retrieveCustomer)

    let calledUser = createCustomer.firstCall.args[0] // get the object that it was called with for testing
    calledUser.should.be.instanceOf(Object)
    calledUser.should.have.property('email')
    calledUser.email.should.be.equal(sentUser.email)

    done()
  })

  it('should reject a user without an email', (done) => {
    // stub these functions
    let retrieveCustomer = sinon.stub(_stripe.api.customers, 'retrieve').resolves()
    let createCustomer = sinon.stub(_stripe.api.customers, 'create').resolves()

    _stripe.retrieveOrCreateCustomer({}, 'payment')

    // restore stubs
    retrieveCustomer.restore()
    createCustomer.restore()

    sinon.assert.notCalled(createCustomer)
    sinon.assert.notCalled(retrieveCustomer)
    

    done()
  })
})