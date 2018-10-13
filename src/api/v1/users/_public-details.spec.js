// package imports
const chai = require('chai')
const should = chai.should()

// project imports
const helpers = require('./_public-details')

describe('_public-details helper', () => {
  describe('validate request', () => {
    it('should return true when proper query params are passed in for both', () => {
      let students_ids = ["59bd8e3eee48dfca29138e87", "59bd8ff45239f3001105dba8"]
      let temp_ids = ["5b2053637c41e443323a1c1a"]

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return true when proper query params are passed in for temp_ids only', () => {
      let students_ids = [""]
      let temp_ids = ["5b2053637c41e443323a1c1a"]

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return true when proper query params are passed in for students_ids only', () => {
      let students_ids = ["59bd8e3eee48dfca29138e87"]
      let temp_ids = [""]

      let validator = helpers.validateRequest(students_ids, temp_ids)
      validator.should.be.equal(true)
    })

    it('should return false when query params are empty for both', () => {
      let students_ids = [""]
      let temp_ids = [""]

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

  // // stringToArray - should return back an array from a string of _ids separate by commas (length 1)
  // it('should ', () => {
    
  // })

  // // stringToArray - should return back an array from a string of _ids separate by commas (length 3)
  // it('should ', () => {
    
  // })

  // // initialQueryObject - return User.find()
  // it('should ', () => {
    
  // })

  // // initialQueryObject - return TempUser.find()
  // it('should ', () => {
    
  // })

  // // _idNull - return true
  // it('should ', () => {
    
  // })

  // // _idNull - return false
  // it('should ', () => {
    
  // })

  // // combineArrays - should return an array of users and tempusers
  // it('should ', () => {
    
  // })

  // // combineArrays - should return an array of users only
  // it('should ', () => {
    
  // })

  // // combineArrays - should return an array of tempusers only
  // it('should ', () => {
    
  // })

  // // combineArrays - should return an empty array
  // it('should ', () => {
    
  // })

  // // addUserType - return array and check first object for userType property
  // it('should ', () => {
    
  // })
})