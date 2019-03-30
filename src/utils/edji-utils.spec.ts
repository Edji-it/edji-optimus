// library imports
import 'mocha'
import { expect } from 'chai'
import { spy } from 'sinon'

// project imports
import { EdjiUtils } from './edji-utils'

const mockRes = (options?: any) => {
  return {
    getHeader: spy(),
    setHeader: spy()
  }
}

describe('EdjiUtils', () => {
  describe('constructor', () => {
    it('should assign proper defaults', () => {
      const currentEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'test'
      const options = {
        appId: 'test'
      }
      const edji = new EdjiUtils(options)
      expect(edji.appId).to.be.equal(options.appId)
      expect(edji.env).to.be.equal(process.env.NODE_ENV)
      expect(edji.doLog).to.be.equal(true)
      process.env.NODE_ENV = currentEnv
    })
    it('should allow overriding of defaults', () => {
      const options = {
        appId: 'test',
        env: 'test',
        doLog: false
      }
      const edji = new EdjiUtils(options)
      expect(edji.appId).to.be.equal(options.appId)
      expect(edji.env).to.be.equal(options.env)
      expect(edji.doLog).to.be.equal(options.doLog)
    })
  })
})