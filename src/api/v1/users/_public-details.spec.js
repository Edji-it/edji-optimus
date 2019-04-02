// package imports
const chai = require('chai')

// project imports
const helpers = require('./_public-details')

describe('_public-details helper', () => {
  describe('validate request', () => {
    it('should return true when proper query params are passed in for both', () => {
      let students_ids = ['59bd8e3eee48dfca29138e87', '59bd8ff45239f3001105dba8']
      let temp_ids = ['5b2053637c41e443323a1c1a']

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return true when proper query params are passed in for temp_ids only', () => {
      let students_ids = ['']
      let temp_ids = ['5b2053637c41e443323a1c1a']

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return true when proper query params are passed in for students_ids only', () => {
      let students_ids = ['59bd8e3eee48dfca29138e87']
      let temp_ids = ['']

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return false when query params are empty for both', () => {
      let students_ids = ['']
      let temp_ids = ['']

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(false)
    })

    it('should return false when query params are missing for both', () => {
      let students_ids
      let temp_ids

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(false)
    })
  })

  describe('check for empty arrays in request - _idNull', () => {
    it('should return true if the array is not defined', () => {
      let students_ids

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(true)
    })

    it('should return true if the array is defined but is empty', () => {
      let students_ids = ['']

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(true)
    })

    it('should return false if the array is defined and is not empty', () => {
      let students_ids = ['59bd8e3eee48dfca29138e87']

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(false)
    })
  })
})
