import * as rp from 'request-promise-native'
import * as sentry from '@sentry/node'
import { ObjectId } from 'mongodb'
import { expect } from 'chai'
import { assert, stub, mock, SinonStub, SinonMock } from 'sinon'
require('sinon-mongoose')

import { deleteFromS3, updatePropertyArray } from './_update'
import * as helpers from './_update'
import * as Project from './../../../models/Project'
import * as Comment from './../../../models/Comment'

describe('update project helpers', () => {
  describe('deleteFromS3', () => {
    const deleteUrl = 'jjdisaofkeq#$#@@^%#^%' // just a string to pass and verify the call with
    let rpStub: SinonStub
    beforeEach(() => {
      rpStub = stub(rp, 'del')
    })
    afterEach(() => {
      rpStub.restore()
    })
    it('should call delete with the correct parameters', async () => {
      await deleteFromS3(deleteUrl)
      assert.calledOnce(rpStub)
      const { uri, headers, json } = rpStub.firstCall.args[0]
      expect(uri).to.exist
      expect(uri.includes(deleteUrl)).to.be.false
      expect(uri.includes(encodeURIComponent(deleteUrl))).to.be.true
    })
    it('should capture an exception if the request returns an error', async () => {
      const exceptionStub = stub(sentry, 'captureException')
      rpStub.rejects()
      await deleteFromS3(deleteUrl)
      assert.calledOnce(rpStub)
      assert.calledOnce(exceptionStub)
      exceptionStub.restore()
    })
  })
  // describe('updatePropertyArray', () => {
  //   const project_id = new ObjectId().toHexString()
  //   const user_id = new ObjectId()
  //   let projectMock: SinonMock
  //   // let findProjectStub: SinonStub
  //   let saveProjectStub: SinonStub
  //   let validateCommentStub: SinonStub
  //   let deleteFromS3Stub: SinonStub
  //   beforeEach(() => {
  //     saveProjectStub = stub(Project.prototype, 'edjiSave')
  //     projectMock = mock(Project)
  //     validateCommentStub = stub(Comment.prototype, 'validate').resolves()
  //     deleteFromS3Stub = stub(helpers, 'deleteFromS3')
  //   })
  //   afterEach(() => {
  //     saveProjectStub.restore()
  //     projectMock.verify()
  //     projectMock.restore()
  //     Comment.prototype.validate.restore()
  //     deleteFromS3Stub.restore()
  //   })
  //   it('should not call deleteFromS3 when creating a new comment', async () => {
  //     const update = {
  //       data: 'a new string'
  //     }
  //     projectMock
  //       .expects('findById')
  //       .resolves(new Project({ comments: [] }))

  //     const res = await updatePropertyArray({ project_id, user_id, update }, 'comments')
  //     assert.notCalled(deleteFromS3Stub)
  //     expect(res).to.have.property('data')
  //     expect(res.data).to.be.equal(update.data)
  //   })
  //   it('should call deleteFromS3 when updating the url on a comment', async () => {
  //     const commentToUpdate = new Comment({
  //       _id: new ObjectId(),
  //       user_id, // important to pass the same user_id as in the updatePropertyArray call
  //       url: 'somestring'
  //     })
  //     const update = {
  //       _id: commentToUpdate._id,
  //       url: 'someNewString'
  //     }
  //     projectMock.expects('findById')
  //       .resolves(new Project(
  //         {
  //           comments: [commentToUpdate]
  //         }
  //       ))
  //     const res = await updatePropertyArray({ project_id, user_id, update }, 'comments')
  //     assert.calledOnce(deleteFromS3Stub)
  //   })
  // })
})