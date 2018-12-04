// library imports
import 'mocha'
import * as chai from 'chai'
import { stub, mock, SinonStub, assert } from 'sinon'
import { ObjectId } from 'mongodb'

import * as ReadingVersion from './../../../models/ReadingVersion'
import { assignVersionId } from './_create'

describe('readings _create', () => {
  let updateStub: SinonStub
  let saveStub: SinonStub
  beforeEach(() => {
    updateStub = stub(ReadingVersion, 'findOneAndUpdate').resolves()
    saveStub = stub(ReadingVersion.prototype, 'save')
  })
  afterEach(() => {
    updateStub.restore()
  })
  it('should assign a new version id if there is no owner id', async () => {
    let userId: ObjectId = new ObjectId()
    let reading: any = {
    }
    await assignVersionId(reading, userId)
    reading.version_id.should.exist
    assert.notCalled(updateStub)

  })
  it('should assign a new version id if the owner_id is not equal to the user id')
  it('should assign a new version id if there is not a version id')
  it('should update the ReadingVersion if not assigning a new version id')
  // let args: any[] = updateStub.getCall(0).args
  // let query = args[0]
  // query.should.have.property('_id')

  // query.should.
  // let update = args[1]
  it('should modify the passed in reading to assign the owner id to the current user id')
})