// library imports
import 'mocha'
import * as chai from 'chai'
import { stub, spy, SinonStub, assert } from 'sinon'
import { ObjectId } from 'mongodb'

import * as User from './../../../models/User'
import * as ReadingVersion from './../../../models/ReadingVersion'
import * as Referral from './../../../models/Referral'
import { assignVersionId, recordUserReferral } from './_create'

describe('readings _create', () => {
  describe('assignVersionId', () => {
    let updateStub: SinonStub
    let saveStub: SinonStub
    let validReading: any
    beforeEach(() => {
      updateStub = stub(ReadingVersion, 'findOneAndUpdate').resolves()
      saveStub = stub(ReadingVersion.prototype, 'save')
      validReading = {
        owner_id: new ObjectId(),
        version_id: new ObjectId()
      }
    })
    afterEach(() => {
      updateStub.restore()
      saveStub.restore()
    })
    it('should assign a new version id if there is no owner id', async () => {
      let userId: ObjectId = new ObjectId()
      delete validReading.owner_id
      await assignVersionId(validReading, userId)
      validReading.version_id.should.exist
      assert.notCalled(updateStub)
      assert.calledOnce(saveStub)
    })
    it('should assign a new version id if the owner_id is not equal to the user id', async () => {
      let userId: ObjectId = new ObjectId()
      await assignVersionId(validReading, userId)
      validReading.version_id.should.exist
      assert.notCalled(updateStub)
      assert.calledOnce(saveStub)
    })
    it('should modify the passed in reading to assign the owner id to the current user id', async () => {
      let userId: ObjectId = new ObjectId()
      await assignVersionId(validReading, userId)
      validReading.owner_id.should.be.equal(userId)
    })
    it('should assign a new version id if there is not a version id', async () => {
      let userId: ObjectId = new ObjectId()
      validReading.owner_id = userId
      delete validReading.version_id
      await assignVersionId(validReading, userId)
      validReading.version_id.should.exist
      assert.notCalled(updateStub)
      assert.calledOnce(saveStub)
    })
    it('should update the ReadingVersion if not assigning a new version id', async () => {
      let userId: ObjectId = new ObjectId()
      validReading.owner_id = userId
      await assignVersionId(validReading, userId)
      assert.notCalled(saveStub)
      assert.calledOnce(updateStub)
      let args: any[] = updateStub.getCall(0).args
      let query = args[0]
      query.should.have.property('_id')
      query._id.should.be.equal(validReading.version_id)
      query.should.have.property('owner_id')
      query.owner_id.should.be.equal(userId)
    })
  })
  describe('recordUserReferral', () => {
    let user: any
    let referralUpdateStub: SinonStub
    beforeEach(() => {
      user = {
        _id: new ObjectId(),
        referred_by: '123xyz',
        prefs: {
          onboarding: {
            firstReadingCreated: {
            }
          }
        },
        edjiSave: spy()
      }
      referralUpdateStub = stub(Referral, 'findOneAndUpdate')
    })
    afterEach(() => {
      referralUpdateStub.restore()
    })
    it('should update the user and referral when a user has not used their referral', async () => {
      await recordUserReferral(user)
      assert.calledOnce(user.edjiSave)
      assert.calledOnce(referralUpdateStub)
      user.prefs.onboarding.firstReadingCreated.firstDone.should.exist
      let query = referralUpdateStub.getCall(0).args[0]
      query.should.have.property('code')
      query.code.should.be.equal(user.referred_by)
      query.should.have.property('users_referred.user_id')
      query['users_referred.user_id'].should.be.equal(user._id)
    })
    it('should work with a user that does not yet have a prefs object', async () => {
      delete user.prefs
      await recordUserReferral(user)
      assert.calledOnce(user.edjiSave)
      assert.calledOnce(referralUpdateStub)
    })
    it('should not update the user when they not have a referred_by property', async () => {
      delete user.referred_by
      await recordUserReferral(user)
      assert.notCalled(user.edjiSave)
      assert.notCalled(referralUpdateStub)
    })
    it('should not update the user when the user\'s referral has already been credited', async () => {
      user.prefs.onboarding.firstReadingCreated.firstDone = Date.now()
      assert.notCalled(user.edjiSave)
      assert.notCalled(referralUpdateStub)
    })
  })
})