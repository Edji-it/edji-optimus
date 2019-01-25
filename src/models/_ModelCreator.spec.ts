// library imports
import 'mocha'
import { expect } from 'chai'
import { stub, SinonStub, assert } from 'sinon'
import * as sentry from '@sentry/node'

import elastic from './../elasticsearch'
import { executeSaveAndIndex } from './_ModelCreator'

describe('_ModelCreator', () => {
  describe('executeSaveAndIndex', () => {
    let saveData = { customProp: 'unique value 123' }
    let indexData = { customIndex: 'unique' }
    let indexName = 'readings'
    let fakeId = '123456789012'
    let rejectErr = { error: 'something went horribly wrong' }
    let elasticStub: SinonStub
    let sentryStub: SinonStub
    beforeEach(() => {
      elasticStub = stub(elastic, 'delete')
      sentryStub = stub(sentry, 'captureException')
    })
    afterEach(() => {
      elasticStub.restore()
      sentryStub.restore()
    })
    it('should return the results of a save only operation', async () => {
      let save = Promise.resolve(saveData)
      let { saveResults, indexResults } = await executeSaveAndIndex({ save })
      expect(saveResults).to.have.property('customProp')
      expect(saveResults.customProp).to.be.equal(saveData.customProp)
      expect(indexResults).to.be.undefined
    })
    it('should return the results of a save and index operation', async () => {
      let save = Promise.resolve(saveData)
      let index = Promise.resolve(indexData)
      let { saveResults, indexResults } = await executeSaveAndIndex({ save, index, indexName, id: fakeId })
      expect(saveResults).to.have.property('customProp')
      expect(saveResults.customProp).to.be.equal(saveData.customProp)
      expect(indexResults).to.have.property('customIndex')
      expect(indexResults.customIndex).to.be.equal(indexData.customIndex)
    })
    it('should receive an error if both save and index operations fail', async () => {
      let save = Promise.reject(rejectErr)
      let index = Promise.reject(rejectErr)
      try {
        let { saveResults, indexResults } = await executeSaveAndIndex({ save, index, indexName, id: fakeId })
        expect(true, 'expected to receive an error but received success instead').to.be.false
      } catch (err) {
        expect(err).to.have.property('isError')
        expect(err.isError).to.be.true
        expect(err.error).to.be.equal(rejectErr.error)
        assert.calledOnce(sentryStub)
      }
    })
    it('should delete the indexed item if save operation fails', async () => {
      let save = Promise.reject(rejectErr)
      let index = Promise.resolve(indexData)
      try {
        let { saveResults, indexResults } = await executeSaveAndIndex({ save, index, indexName, id: fakeId })
        expect(true, 'expected to receive an error but received success instead').to.be.false
      } catch (err) {
        assert.calledOnce(elasticStub)
        let params = elasticStub.getCall(0).args[0]
        expect(params.index).to.be.equal('readings')
        expect(params.type).to.be.equal('default')
        expect(params.id).to.be.equal(fakeId)
      }
    })
    it('should capture an exception with sentry if there is an error only in indexing', async () => {
      let save = Promise.resolve(saveData)
      let index = Promise.reject(rejectErr)
      let { saveResults, indexResults } = await executeSaveAndIndex({ save, index, indexName, id: fakeId })
      expect(saveResults).to.have.property('customProp')
      expect(saveResults.customProp).to.be.equal(saveData.customProp)
      expect(indexResults).to.be.undefined
      assert.calledOnce(sentryStub)
    })
    it('should capture an error in sentry if the delete operation fails', async () => {
      let elasticError = { error: 'some error in elastic' }
      elasticStub.rejects(elasticError)
      let save = Promise.reject(rejectErr)
      let index = Promise.resolve(indexData)
      try {
        let { saveResults, indexResults } = await executeSaveAndIndex({ save, index, indexName, id: fakeId })
        expect(true, 'expected to receive an error but received success instead').to.be.false
      } catch (err) {
        assert.calledOnce(elasticStub)
        assert.calledOnce(sentryStub)
      }
    })
  })
})