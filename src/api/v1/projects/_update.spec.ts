import * as rp from 'request-promise-native'
import * as sentry from '@sentry/node'
import { expect } from 'chai'
import { stub, SinonStub, assert } from 'sinon'

import { deleteFromS3 } from './_update'

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
})