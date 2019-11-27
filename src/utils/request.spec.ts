import { expect } from 'chai'
import * as chai from 'chai'
chai.use(require('sinon-chai'))
import { stub } from 'sinon'
import * as proxyquire from 'proxyquire'
import { EdjiRequestError, EdjiRequestOptions } from './request'

const requestStub = stub()

const request = proxyquire('./request', {
  request: requestStub,
}).default

describe('request util', () => {
  beforeEach(() => {
    requestStub.reset()
  })
  const methods = ['GET', 'POST', 'PUT', 'DELETE']
  methods.forEach(method => {
    it(`should make a ${method} request`, async () => {
      const body = { success: true }
      requestStub.callsArgWith(1, null, {}, body)
      const result = await request({ method })
      expect(result).to.deep.equal(body)
      expect(requestStub).calledOnce
      expect(requestStub.firstCall.args[0]).to.deep.equal({
        json: true,
        method,
        retryOnStatusCodes: [502, 503],
        retries: 0,
      })
    })
  })
  it('should retry multiple times', async () => {
    const options: EdjiRequestOptions = { method: 'GET', url: '/spoopy', retries: 6 }
    const error = { message: 'cannot GET /spoopy' }
    const res = { statusCode: 502 }
    const body = {}
    requestStub.callsArgWith(1, error, res, body)
    try {
      await request(options)
    } catch (err) {
      expect(requestStub).callCount(7)
      expect(err).to.have.property('message', 'cannot GET /spoopy')
      expect(err).to.have.property('name', 'EDJI_REQUEST_ERROR')
      expect(err).to.have.property('url', '/spoopy')
      expect(err).to.have.property('statusCode', 502)
      expect(err).to.have.property('retryCount', 6)
    }
  })
  it('should stop retries on success', async () => {
    const options: EdjiRequestOptions = { method: 'GET', url: '/spoopy', retries: 6 }
    const error = { message: 'cannot GET /spoopy' }
    const res = { statusCode: 502 }
    const body = { success: true }
    requestStub.callsArgWith(1, error, res, body)
    requestStub.onCall(2).callsArgWith(1, null, { statusCode: 200 }, body)
    await request(options)
    expect(requestStub).callCount(3)
  })
  it('should retry on specified response codes', async () => {
    const options: EdjiRequestOptions = { method: 'GET', url: '/spoopy', retries: 4, retryOnStatusCodes: [400] }
    const error = { message: 'cannot GET /spoopy' }
    const res = { statusCode: 400 }
    const body = {}
    requestStub.callsArgWith(1, error, res, body)
    try {
      await request(options)
    } catch (err) {
      expect(requestStub).callCount(5)
    }
  })
  it('should not retry when receiving a non-retry code', async () => {
    const options: EdjiRequestOptions = { method: 'GET', url: '/spoopy', retries: 6 }
    const error = { message: 'cannot GET /spoopy' }
    const res = { statusCode: 502 }
    const body = { success: true }
    requestStub.callsArgWith(1, error, res, body)
    requestStub.onCall(2).callsArgWith(1, { message: 'access denied' }, { statusCode: 400 }, body)
    try {
      await request(options)
    } catch (err) {
      expect(requestStub).callCount(3)
      expect(err).to.have.property('message', 'access denied')
    }
  })
})
