import { expect } from 'chai'
import { stub, SinonStub } from 'sinon'

import { getRedirectURI, RedirectParams, tester } from './oauth'

describe('oauth', () => {
  // before(() => {
  //   process.env.GOOGLE_REDIRECT_URI = 'https://edji.it/api/v1/auth/google/callback'
  // })
  describe('getRedirectURI', () => {
    const defaultParams: RedirectParams = {
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
  // describe('getTokenRedirectDestination', () => {})
})
