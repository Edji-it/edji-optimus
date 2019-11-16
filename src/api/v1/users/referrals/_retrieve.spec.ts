// library imports
import 'mocha'
import * as chai from 'chai'
import { stub, mock, SinonStub, SinonMock } from 'sinon'
import { ObjectId } from 'mongodb'
require('sinon-mongoose')

// project imports
import Referral from './../../../../models/Referral'
// const helpers = require('./_retrieve')
import { createUniqueReferral } from './_retrieve'

describe('createUniqueReferralCode', () => {
  let fakeReferral = {
    _id: new ObjectId(),
    code: '12345',
    users_referred: [],
  }
  let ReferralMock: SinonMock
  let referralSaveStub: SinonStub

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

    ReferralMock.expects('findOne').resolves(undefined)

    let referral: any = await createUniqueReferral()
    referral.code.should.be.equal(fakeReferral.code)
    referral._id.should.be.equal(fakeReferral._id)
  })

  it('should attempt to find a unique code 5 times before throwing an error', async () => {
    referralSaveStub.resolves(fakeReferral)

    ReferralMock.expects('findOne')
      .exactly(5)
      .resolves([{ code: 'some_code' }])

    try {
      await createUniqueReferral()
    } catch (err) {
      return // we expect this to throw an error
    }

    throw new Error('did not throw expected error')
  })
})
