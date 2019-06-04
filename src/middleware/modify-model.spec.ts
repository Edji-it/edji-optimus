// library imports
import { expect } from 'chai'
import { assert, stub } from 'sinon'

// project imports
import { simpleUpdate } from './modify-model'

describe('modify-model', () => {
  describe('simpleUpdate', () => {
    const updateStub = stub()
    const mockNext = stub()
    const mockSend = stub()
    const mockStatus = stub().returns({
      send: mockSend,
    })
    const mockModel: any = {
      updateOne: updateStub,
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
      updateStub.reset()
      mockStatus.resetHistory()
      mockSend.resetHistory()
    })
    it('should update a document by id', async () => {
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(mockNext)
      assert.calledWithExactly(
        updateStub,
        { _id: mockRequest.params.reading_id, owner_id: mockRequest.context.user._id },
        { $set: mockRequest.body },
        { runValidators: true },
      )
      assert.notCalled(mockResponse.status)
    })
    it('should not update a model with invalid update properties', async () => {
      await simpleUpdate(mockModel, 'reading_id', [])(mockRequest, mockResponse, mockNext)
      assert.notCalled(mockNext)
      assert.calledWithExactly(mockStatus, 400)
      assert.calledOnce(mockSend)
    })
    it('should process an error', async () => {
      const mockError = { error: 'it is wrong' }
      updateStub.throws(mockError)
      try {
        await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      } catch (err) {
      } finally {
        assert.calledWith(mockNext, mockError)
      }
    })
  })
})
