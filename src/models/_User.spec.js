// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')

// project imports
const stripe = require('./../api/v1/stripe/_stripe').api
const _User = require('./_User')

describe('_User', () => {
  describe('getUserHeroStatus', () => {
    let retrieveSubscriptions

    beforeEach(() => {
      retrieveSubscriptions = sinon.stub(stripe.subscriptions, 'list').resolves({ data: [{}] }) // resolving with non-empty data array should me the user has active subscriptions
    })

    afterEach(() => {
      retrieveSubscriptions.restore()
    })

    it('should return return true if the customer has a license id', (done) => {
      _User.getUserHeroStatus({ license_ids: ['1234'] })
      .then((heroStatus) => {
        heroStatus.should.be.true
        sinon.assert.notCalled(retrieveSubscriptions)
        done()
      })
      .catch((err) => {
        done(err)
      })
    })

    it('should return false if the user does not have license_ids or a stripe_customer_id', (done) => {
      _User.getUserHeroStatus({ license_ids: [] })
      .then((heroStatus) => {
        heroStatus.should.be.false
        sinon.assert.notCalled(retrieveSubscriptions)
        done()
      })
      .catch((err) => {
        done(err)
      })
    })

    it('should return true and call stripe.subscriptions.list with the correct parameters', (done) => {
      let fakeUser = { stripe_customer_id: 'cus_123abc' }
      _User.getUserHeroStatus(fakeUser)
      .then((heroStatus) => {
        heroStatus.should.be.true
        sinon.assert.calledOnce(retrieveSubscriptions)

        // test what stripe was called with
        let callObj = retrieveSubscriptions.firstCall.args[0]
        callObj.should.have.property('customer')
        callObj.customer.should.be.equal(fakeUser.stripe_customer_id)
        callObj.should.have.property('plan')
        callObj.plan.should.be.equal('yearly')
        callObj.should.have.property('status')
        callObj.status.should.be.equal('active')

        done()
      })
      .catch((err) => {
        done(err)
      })
    })

    it('should return false if stripe returns no subscriptions', (done) => {
      // redefine the retrieveSubscriptions stub
      retrieveSubscriptions.restore()
      retrieveSubscriptions = sinon.stub(stripe.subscriptions, 'list').resolves({ data: [] })

      let fakeUser = { stripe_customer_id: 'cus_123abc' }
      _User.getUserHeroStatus(fakeUser)
      .then((heroStatus) => {
        heroStatus.should.be.false
        sinon.assert.calledOnce(retrieveSubscriptions)

        done()
      })
      .catch((err) => {
        done(err)
      })
    })
  })
})