// package imports
const chai = require('chai')
const should = chai.should()

// local imports
const helpers = require('./_list')

describe('_list', () => {
  it('should have the required properties', () => {
    helpers.should.be.instanceof(Object)
    helpers.should.not.have.property('nothing')

    const propertiesToCheck = [
      'validateQuery',
      'baseAggregation',
      'populateProjectAggregation',
      'paginate'
    ]

    for(key of Object.keys(helpers)) {
      propertiesToCheck.indexOf(key).should.be.above(-1)
    }
  })

  describe('validateQuery', () => {
    it('should be a function', () => {
      ( typeof helpers.validateQuery ).should.be.equal('function')
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
        notexist: 'projects'
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should accept all valid pop parameters in an array', () => {
      let query = helpers.validateQuery({
        pop: ['projects'] // additional parameters should be added here
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should accept a single valid pop parameter as a string', () => {
      let query = helpers.validateQuery({
        pop: 'projects'
      })
      query.should.have.property('error')
      should.not.exist(query.error)
    })
    it('should throw an error if a string or array is not passed into pop', () => {
      let query = helpers.validateQuery({
        pop: 9
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should throw an error if passed an invalid pop value in an array', () => {
      let query = helpers.validateQuery({
        pop: ['projects', 'notprojects']
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
    it('should throw an error if passed an invalid pop value as a string', () => {
      let query = helpers.validateQuery({
        pop: 'notprojects'
      })
      query.should.have.property('error')
      should.exist(query.error)
    })
  })
})