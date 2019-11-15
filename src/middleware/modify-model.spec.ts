// library imports
import { expect } from 'chai'
import { assert, stub } from 'sinon'

// project imports
import { simpleUpdate } from './modify-model'

describe('modify-model', () => {
  describe('simpleUpdate', () => {
    const mockNext = stub()
    const mockSend = stub()
    const mockStatus = stub().returns({
      send: mockSend,
    })
    const mockModel: any = {
      updateOne: stub(),
      getIndexOptions: true,
      updateIndex: stub(),
    }
    const mockRequest: any = {
      params: {
        reading_id: '12345',
      },
      body: {
        someParam: Date.now(),
      },
      context: {
        user: {
          _id: '59bd8ff45239f3001105dba8',
        },
      },
    }
    const mockResponse: any = {
      status: mockStatus,
    }
    beforeEach(() => {
      mockNext.resetHistory()
      mockModel.updateOne.reset()
      mockStatus.resetHistory()
      mockSend.resetHistory()
      mockModel.updateIndex.reset()
    })
    it('should update a document by id', async () => {
      mockModel.updateOne.resolves({ n: 1 })
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(mockNext)
      assert.calledWithExactly(
        mockModel.updateOne,
        { _id: mockRequest.params.reading_id, owner_id: mockRequest.context.user._id },
        { $set: mockRequest.body },
        { runValidators: true },
      )
      assert.calledWithExactly(mockStatus, 200)
      assert.calledOnce(mockModel.updateIndex)
    })
    it('should not update a model with invalid update properties', async () => {
      await simpleUpdate(mockModel, 'reading_id', [])(mockRequest, mockResponse, mockNext)
      assert.notCalled(mockNext)
      assert.calledWithExactly(mockStatus, 400)
      assert.calledOnce(mockSend)
    })
    it('should indicate a 403 status if no documents were updated', async () => {
      mockModel.updateOne.resolves({ n: 0 })
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(mockNext)
      assert.calledWithExactly(mockStatus, 403)
    })
    it('should process the update into the search index', async () => {
      mockModel.updateOne.resolves({ n: 1 })
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledWithExactly(mockModel.updateIndex, mockRequest.params.reading_id)
    })
    it('should process an error', async () => {
      const mockError = { error: 'it is wrong' }
      mockModel.updateOne.throws(mockError)
      try {
        await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      } catch (err) {
      } finally {
        assert.calledWith(mockNext, mockError)
      }
    })
  })
})
