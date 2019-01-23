// library imports
import 'mocha'
import { expect } from 'chai'
import { stub, SinonStub, assert } from 'sinon'

import elastic from './../elasticsearch'
import { executeSaveAndIndex } from './_ModelCreator'

describe('_ModelCreator', () => {
  describe('executeSaveAndIndex', () => {
    let saveData = { customProp: 'unique value 123' }
    let indexData = { customIndex: 'unique' }
    let fakeId = '123456789012'
    let elasticStub: SinonStub
    beforeEach(() => {
      elasticStub = stub(elastic, 'delete')
    })
    afterEach(() => {
      elasticStub.restore()
    })
    it('should return the results of a save only operation', async () => {
      let save = Promise.resolve(saveData)
      let { saveResults, indexResults } = await executeSaveAndIndex(fakeId, { save })
      expect(saveResults).to.have.property('customProp')
      expect(saveResults.customProp).to.be.equal(saveData.customProp)
      expect(indexResults).to.be.undefined
    })
    it('should return the results of a save and index operation', async () => {
      let save = Promise.resolve(saveData)
      let index = Promise.resolve(indexData)
      let { saveResults, indexResults } = await executeSaveAndIndex(fakeId, { save, index })
      expect(saveResults).to.have.property('customProp')
      expect(saveResults.customProp).to.be.equal(saveData.customProp)
      expect(indexResults).to.have.property('customIndex')
      expect(indexResults.customIndex).to.be.equal(indexData.customIndex)
    })
    it('should delete the indexed item if save operation fails', async () => {
      let save = Promise.reject({ error: 'something went horribly wrong' })
      let index = Promise.resolve(indexData)
      let { saveResults, indexResults } = await executeSaveAndIndex(fakeId, { save, index })
      assert.calledOnce(elasticStub)
      let params = elasticStub.getCall(0).args[0]
      expect(params.index).to.be.equal('readings')
      expect(params.type).to.be.equal('default')
      expect(params._id).to.be.equal(fakeId)
      // expect(params._sid).to.be.equal()
    })
  })
})