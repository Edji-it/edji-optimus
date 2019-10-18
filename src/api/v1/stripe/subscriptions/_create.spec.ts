// package imports
import { expect } from 'chai'

// local imports
import { validateBody } from './_create'

describe('subscriptions _create helpers', () => {
  describe('validateBody', () => {
    it('should return an object', () => {
      const body = validateBody({})
      expect(body).to.be.instanceOf(Object)
    })

    // should have all of the valid properties of the body
    const MAX_BODY = {
      couponCode: 'SOME_CODE',
      token: 'some_string',
    }
    it('should be valid when passed with all available parameters', () => {
      const body = validateBody(MAX_BODY)
      expect(body).to.have.property('error')
      expect(body.error).to.not.exist
    })

    // validate that the MVP_BODY is really the minimum required
    it('should be valid when passed with only token parameter', () => {
      const body = validateBody({ token: 'i_got_cash' })
      expect(body).to.have.property('error')
      expect(body.error).to.not.exist
    })

    it('should be valid when passed with only a couponCode parameter', () => {
      const body = validateBody({ couponCode: 'somecode' })
      expect(body).to.have.property('error')
      expect(body.error).to.not.exist
    })

    // this is so that, if the front end is passing something which is intended to be used but has the incorrect property name,
    //  it will return an error and be caught
    it('should return an error when passed with unnecessary parameters', () => {
      let testBody = {
        unnecessary: true,
        token: 'some_token',
      }
      const body = validateBody(testBody)
      expect(body).to.have.property('error')
      expect(body.error).to.exist
    })
  })
})
