// package imports
const chai = require('chai')
const sinon = require('sinon')
const mongoose = require('mongoose')
require('sinon-mongoose')

// project imports
const Referral = require('./../../../../models/Referral')
const helpers = require('./_retrieve')

describe('createUniqueReferralCode', () => {
  let fakeReferral = {
    _id: mongoose.Types.ObjectId(),
    code: '12345',
    users_referred: []
  }
  let ReferralMock = sinon.mock(Referral)
  let referralSaveStub

  beforeEach(() => {
    ReferralMock = sinon.mock(Referral)
    referralSaveStub = sinon.stub(Referral.prototype, 'edjiSave')
  })

  afterEach(() => {
    ReferralMock.verify()
    ReferralMock.restore()
    referralSaveStub.restore()
  })

  it('should return a generated code', (done) => {
    referralSaveStub.yields(false, fakeReferral)

    ReferralMock
      .expects('find')
      .chain('exec')
      .resolves([])

    helpers.createUniqueReferral()
      .then((referral) => {
        referral.code.should.be.equal(fakeReferral.code)
        referral._id.should.be.equal(fakeReferral._id)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('should re-call 5 times before exit', (done) => {
    referralSaveStub.yields(false, fakeReferral)

    ReferralMock
      .expects('find').exactly(5)
      .chain('exec').exactly(5)
      .resolves([{ code: 'some_code' }])

    helpers.createUniqueReferral()
      .then(() => {
        done(new Error('should not have resolved with referral'))
      })
      .catch((err) => {
        done()
      })
  })
})