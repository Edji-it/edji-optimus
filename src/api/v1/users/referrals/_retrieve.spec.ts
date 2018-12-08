// library imports
import 'mocha'
import * as chai from 'chai'
import { stub, mock } from 'sinon'
import { ObjectId } from 'mongodb'
require('sinon-mongoose')

// project imports
import * as Referral from './../../../../models/Referral'
// const helpers = require('./_retrieve')
import { createUniqueReferral } from './_retrieve'

describe('createUniqueReferralCode', () => {
  let fakeReferral = {
    _id: ObjectId(),
    code: '12345',
    users_referred: []
  }
  let ReferralMock = mock(Referral)
  let referralSaveStub

  beforeEach(() => {
    ReferralMock = mock(Referral)
    referralSaveStub = stub(Referral.prototype, 'edjiSave')
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

    let referral = await createUniqueReferral()
    referral.code.should.be.equal(fakeReferral.code)
    referral._id.should.be.equal(fakeReferral._id)
  })

  it('should attempt to find a unique code 5 times before throwing an error', async () => {
    referralSaveStub.resolves(fakeReferral)

    ReferralMock
      .expects('findOne').exactly(5)
      .resolves([{ code: 'some_code' }])

    try {
      await createUniqueReferral()
    } catch (err) {
      return // we expect this to throw an error
    }

    throw new Error('did not throw expected error')
  })
})