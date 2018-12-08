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

  it('should return a generated code', async () => {
    referralSaveStub.resolves(fakeReferral)

    ReferralMock
      .expects('findOne')
      .resolves(undefined)

    let referral = await helpers.createUniqueReferral()
    referral.code.should.be.equal(fakeReferral.code)
    referral._id.should.be.equal(fakeReferral._id)
  })

  it('should attempt to find a unique code 5 times before throwing an error', async () => {
    referralSaveStub.resolves(fakeReferral)

    ReferralMock
      .expects('findOne').exactly(5)
      .resolves([{ code: 'some_code' }])

    try {
      await helpers.createUniqueReferral()
    } catch (err) {
      return // we expect this to throw an error
    }

    throw new Error('did not throw expected error')
  })
})