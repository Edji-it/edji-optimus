// package imports
const chai = require('chai')
const should = chai.should()
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
  let ReferralMock
  let referralSaveStub = sinon.stub(Referral.prototype, 'save')

  beforeEach(() => {
    ReferralMock = sinon.mock(Referral)
    referralSaveStub.reset()
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
})