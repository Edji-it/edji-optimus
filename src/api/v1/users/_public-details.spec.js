// package imports
const chai = require('chai')

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

  describe('check for empty arrays in request - _idNull', () => {
    it('should return true if the array is not defined', () => {
      let students_ids

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(true)
    })

    it('should return true if the array is defined but is empty', () => {
      let students_ids = [""]

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(true)
    })

    it('should return false if the array is defined and is not empty', () => {
      let students_ids = ["59bd8e3eee48dfca29138e87"]

      let isNull = helpers._idNull(students_ids)
      isNull.should.be.equal(false)
    })
  })

  describe('combining arrays - or not to combine - combineArrays', () => {
    it('should return an array of users and tempusers', () => {
      let users = [
        {
          "_id": "59bd8e3eee48dfca29138e87",
          "fullname": "Cody",
          "username": "cody",
          "userType": "registered"
        }
      ]
      let tempUsers = [
        {
          "_id": "5b1c65fe06de88003a0ec8c4",
          "fullname": "Just Josh",
          "userType": "temp"
        }
      ]

      const combineArrays = helpers.combineArrays(users, tempUsers)
      // verify number of objects in array
      combineArrays.length.should.be.equal(2)

      // verify first object properties
      const firstResponse = combineArrays[0]
      firstResponse.should.have.property("_id")
      firstResponse.should.have.property("fullname")
      firstResponse.should.have.property("username")
      firstResponse.should.have.property("userType")
      firstResponse.userType.should.be.equal("registered")
      firstResponse.userType.should.not.be.equal("temp")

      // verify second object properties
      const secondResponse = combineArrays[1]
      secondResponse.should.have.property("_id")
      secondResponse.should.have.property("fullname")
      secondResponse.should.not.have.property("username")
      secondResponse.should.have.property("userType")
      secondResponse.userType.should.be.equal("temp")
      secondResponse.userType.should.not.be.equal("registered")
    })

    it('should return an array of users only', () => {
      let users = [
        {
          "_id": "59bd8e3eee48dfca29138e87",
          "fullname": "Cody",
          "username": "cody",
          "userType": "registered"
        }
      ]
      let tempUsers = []

      let combineArrays = helpers.combineArrays(users, tempUsers)
      // verify number of objects in array
      combineArrays.length.should.be.equal(1)

      // verify first object properties
      const firstResponse = combineArrays[0]
      firstResponse.should.have.property("_id")
      firstResponse.should.have.property("fullname")
      firstResponse.should.have.property("username")
      firstResponse.should.have.property("userType")
      firstResponse.userType.should.be.equal("registered")
      firstResponse.userType.should.not.be.equal("temp")
    })

    it('should return an array of tempusers only', () => {
      let users = []
      let tempUsers = [
        {
          "_id": "5b1c65fe06de88003a0ec8c4",
          "fullname": "Just Josh",
          "userType": "temp"
        }
      ]

      let combineArrays = helpers.combineArrays(users, tempUsers)
      // verify number of objects in array
      combineArrays.length.should.be.equal(1)

      // verify first object properties
      const firstResponse = combineArrays[0]
      firstResponse.should.have.property("_id")
      firstResponse.should.have.property("fullname")
      firstResponse.should.not.have.property("username")
      firstResponse.should.have.property("userType")
      firstResponse.userType.should.be.equal("temp")
      firstResponse.userType.should.not.be.equal("registered")
    })

    it('should return an empty array', () => {
      let users = []
      let tempUsers = []

      let combineArrays = helpers.combineArrays(users, tempUsers)
      // verify number of objects in array
      combineArrays.length.should.be.equal(0)
    })
  })
})