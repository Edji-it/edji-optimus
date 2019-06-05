// library imports
import { expect } from 'chai'
import { assert, stub } from 'sinon'

// project imports
import { withQueryValidator } from './validator'

describe('validator util', () => {
  describe('withQueryValidator', () => {
    const value = { prop: Date.now() }
    const validateStub = stub().returns({ value })
    const mockSchema = { validate: validateStub }
    let mockRequest: any
    beforeEach(() => {
      validateStub.resetHistory()
      mockRequest = { query: {} }
    })
    it('should call validate on schema', () => {
      withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      assert.calledOnce(validateStub)
    })
    it('should set context.query to the result of validation', () => {
      withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      expect(mockRequest.query).to.be.equal(value)
    })
    it('should throw validation errors', () => {
      const message = 'a mock error message'
      validateStub.resetBehavior()
      validateStub.returns({ error: { details: [{ message }] } })
      try {
        withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      } catch (err) {
        expect(err.message).to.be.equal(message)
        return // this is expected
      }
      throw new Error('expected validator to throw an error')
    })
  })
  describe('withBodyValidator', () => {
    const value = { prop: Date.now() }
    const validateStub = stub().returns({ value })
    const mockSchema = { validate: validateStub }
    let mockRequest: any
    beforeEach(() => {
      validateStub.resetHistory()
      mockRequest = { body: {} }
    })
    it('should call validate on schema', () => {
      withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      assert.calledOnce(validateStub)
    })
    it('should set context.body to the result of validation', () => {
      withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      expect(mockRequest.query).to.be.equal(value)
    })
    it('should throw validation errors', () => {
      const message = 'a mock error message'
      validateStub.resetBehavior()
      validateStub.returns({ error: { details: [{ message }] } })
      try {
        withQueryValidator(<any>mockSchema)(mockRequest, <any>{}, stub())
      } catch (err) {
        expect(err.message).to.be.equal(message)
        return // this is expected
      }
      throw new Error('expected validator to throw an error')
    })
  })
})
