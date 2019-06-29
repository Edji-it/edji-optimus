// library imports
import { expect } from 'chai'
import { assert, stub } from 'sinon'

// project imports
import { simpleUpdate } from './modify-model'
import * as search from './../services/elasticsearch'

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
    const updateIndexStub = stub(search, 'update')
    beforeEach(() => {
      mockNext.resetHistory()
      updateStub.reset()
      mockStatus.resetHistory()
      mockSend.resetHistory()
      updateIndexStub.reset()
    })
    after(() => {
      updateIndexStub.restore()
    })
    it('should update a document by id', async () => {
      updateStub.resolves({ n: 1 })
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(mockNext)
      assert.calledWithExactly(
        updateStub,
        { _id: mockRequest.params.reading_id, owner_id: mockRequest.context.user._id },
        { $set: mockRequest.body },
        { runValidators: true },
      )
      assert.calledWithExactly(mockStatus, 200)
      assert.notCalled(updateIndexStub)
    })
    it('should not update a model with invalid update properties', async () => {
      await simpleUpdate(mockModel, 'reading_id', [])(mockRequest, mockResponse, mockNext)
      assert.notCalled(mockNext)
      assert.calledWithExactly(mockStatus, 400)
      assert.calledOnce(mockSend)
    })
    it('should indicate a 403 status if no documents were updated', async () => {
      updateStub.resolves({ n: 0 })
      await simpleUpdate(mockModel, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(mockNext)
      assert.calledWithExactly(mockStatus, 403)
    })
    it('should process the update into the search index', async () => {
      const mockIndexOptions: any = { index: 'readings', type: 'default' }
      updateStub.resolves({ n: 1 })
      const model: any = {
        updateOne: updateStub,
        getIndexOptions: stub().returns(mockIndexOptions),
      }
      await simpleUpdate(model, 'reading_id')(mockRequest, mockResponse, mockNext)
      assert.calledOnce(updateIndexStub)
      assert.calledWithExactly(
        updateIndexStub,
        Object.assign({ id: mockRequest.params.reading_id, body: { doc: mockRequest.body } }, mockIndexOptions),
      )
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
