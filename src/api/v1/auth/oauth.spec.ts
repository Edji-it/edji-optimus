import { expect } from 'chai'
import { stub } from 'sinon'

import * as bcrypt from 'bcryptjs'

import { generateOAuthObject, getRedirectURI, RedirectParams } from './oauth'

describe('oauth', () => {
  describe('generateOAuthObject', () => {
    const fakeHashReturn = 'fakehash'
    const hashStub = stub(bcrypt, 'hashSync').returns(fakeHashReturn)
    afterEach(() => {
      hashStub.resetHistory()
    })
    after(() => {
      hashStub.restore()
    })
    it('should generate a valid oauth object', () => {
      const { id, type, singleUseToken, singleUseTokenExpiration } = generateOAuthObject('123', 'google')
      expect(id).to.be.equal('123')
      expect(type).to.be.equal('google')
      expect(singleUseToken).to.be.equal(fakeHashReturn)
      expect(singleUseTokenExpiration).to.be.approximately(
        Date.now() + 1000 * 60,
        100,
        'expected singleUseTokenExpiration close to an hour from now',
      )
    })
  })
  describe('getRedirectURI', () => {
    const defaultParams: RedirectParams = {
      protocol: 'https',
      clientUrl: '//edji.it',
      type: 'google',
      singleUseToken: '$2a$04$8PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
    }
    it('should generate a successful google redirect', () => {
      const uri = getRedirectURI(defaultParams)
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/google?token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a successful clever redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        type: 'clever',
      })
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/clever?token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a duplicate user redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        error: 'duplicate_user',
      })
      expect(uri).to.be.equal(
        'https://edji.it/#/oauth/google?error=duplicate_user&token=%242a%2404%248PJ97HsD9NUssj1sQrrt1e.DDWZYUFz6y1GjW64Q7q.MpxFc6UgIi',
      )
    })
    it('should generate a server error redirect', () => {
      const uri = getRedirectURI({
        ...defaultParams,
        error: 'serverError',
        singleUseToken: '',
      })
      expect(uri).to.be.equal('https://edji.it/#/oauth/google?error=serverError')
    })
  })
})
