// package imports
import { expect } from 'chai'
import { stub, assert } from 'sinon'

// project imports
import { api, retrieveOrCreateCustomer } from './stripe'

describe('_stripe', () => {
  describe('retrieveOrCreateCustomer', () => {
    let retrieveCustomer
    let createCustomer

    beforeEach(() => {
      // stub these functions
      retrieveCustomer = stub(api.customers, 'retrieve').resolves()
      createCustomer = stub(api.customers, 'create').resolves()
    })

    afterEach(() => {
      // restore stubs
      retrieveCustomer.restore()
      createCustomer.restore()
    })

    let fakeUser = {
      email: 'corbin@edji.it',
      stripe_customer_id: 'cus_someid',
      fullanme: 'corbin',
    }

    it('should call retrieve from stripes api', done => {
      retrieveOrCreateCustomer(fakeUser, 'someString')
        .then(() => {
          assert.calledOnce(retrieveCustomer)
          assert.calledWith(retrieveCustomer, fakeUser.stripe_customer_id)
          assert.notCalled(createCustomer)

          done()
        })
        .catch(() => {
          done(new Error('incorrectly rejected the promise'))
        })
    })

    it('should call create from stripes api', done => {
      let sentUser = {
        fullname: 'corbin',
        email: 'corbin@edji.it',
      }

      // unit under test
      retrieveOrCreateCustomer(sentUser, 'newstring')
        .then(() => {
          // assertions
          assert.calledOnce(createCustomer)
          assert.notCalled(retrieveCustomer)

          let calledUser = createCustomer.firstCall.args[0] // get the object that it was called with for testing
          expect(calledUser).to.be.instanceOf(Object)
          expect(calledUser).to.have.property('email')
          expect(calledUser.email).to.equal(sentUser.email)

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should reject a user without an email', done => {
      retrieveOrCreateCustomer({}, 'payment')
        .then(() => {
          done(new Error('should not have successfully resolved'))
        })
        .catch(err => {
          // assertions
          assert.notCalled(createCustomer)
          assert.notCalled(retrieveCustomer)

          done()
        })
    })

    it('should reject if there is no user passed', done => {
      retrieveOrCreateCustomer(false, 'payment')
        .then(() => {
          done(new Error('should not have successfully resolved'))
        })
        .catch(err => {
          // assertions
          assert.notCalled(createCustomer)
          assert.notCalled(retrieveCustomer)

          done()
        })
    })
  })
})
