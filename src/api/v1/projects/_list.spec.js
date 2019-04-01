// package imports
const chai = require('chai')
const should = chai.should()

// local imports
const helpers = require('./_list')

describe('projects _list helpers', () => {
  it('should have the required properties', () => {
    helpers.should.be.instanceof(Object)
    helpers.should.not.have.property('nothing')

    const propertiesToCheck = [
      'validateQuery',
      'baseAggregation',
      'populateReadings',
      'responseShape',
      'populateTeachers',
    ]

    for (key of Object.keys(helpers)) {
      propertiesToCheck.indexOf(key).should.be.above(-1)
    }
  })

  describe('validateQuery', () => {
    // initial validation
    it('should be a function', () => {
      ;(typeof helpers.validateQuery).should.be.equal('function')
    })
    it('should return an object', () => {
      let query = helpers.validateQuery({})
      query.should.be.instanceOf(Object)
    })
    it('should be valid when called without any properties', () => {
      let query = helpers.validateQuery({})
      query.should.have.property('error')
      should.not.exist(query.error) // tests for error being undefined
    })
    it('should have an error when passed a query parameter which does not exist', () => {
      let query = helpers.validateQuery({
        notexist: 'nothing',
      })
      query.should.have.property('error')
      should.exist(query.error)
    })

    // pop value validation
    it('should accept all valid pop parameters in an array', () => {
      let query = helpers.validateQuery({
        pop: ['teacher', 'reading'], // additional parameters should be added here
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should accept a single valid pop parameter as a string', () => {
      let query = helpers.validateQuery({
        pop: 'teacher',
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should throw an error if a string or array is not passed into pop', () => {
      let query = helpers.validateQuery({
        pop: 9,
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should throw an error if passed an invalid pop value in an array', () => {
      let query = helpers.validateQuery({
        pop: ['teacher', 'nothing'],
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should throw an error if passed an invalid pop value as a string', () => {
      let query = helpers.validateQuery({
        pop: 'nada',
      })
      query.should.have.property('error')
      should.exist(query.error)
    })

    // start property validation
    it('should accept a valid start value', () => {
      let query = helpers.validateQuery({
        start: 5,
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should reject a non-number start value', () => {
      let query = helpers.validateQuery({
        start: 'notvalid',
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should reject a start value above the maximum', () => {
      let query = helpers.validateQuery({
        start: 2000,
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should reject a start value below the minimum', () => {
      let query = helpers.validateQuery({
        start: -1,
      })
      query.should.have.property('error')
      should.exist(query.error)
    })

    // size property validation
    it('should accept a valid size value', () => {
      let query = helpers.validateQuery({
        size: 5,
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should reject a non-number size value', () => {
      let query = helpers.validateQuery({
        start: 'notvalid',
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should reject a size value above the maximum', () => {
      let query = helpers.validateQuery({
        size: 51,
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should reject a size value below the minimum', () => {
      let query = helpers.validateQuery({
        size: -1,
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
  })
})
