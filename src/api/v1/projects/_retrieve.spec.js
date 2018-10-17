// library imports
const chai = require('chai')
const should = require('chai').should()

// project imports
const helpers = require('./_retrieve')

describe('populateProperties', () => {
  it('should return an array', () => {
    helpers.populateProperties().should.be.instanceOf(Array)
  })

  it('should populate all possible properties', () => {
    let possibleProperties = [
      'reading_id',
      'teacher'
    ]

    let checkPopulation = {}
    possibleProperties.forEach((prop) => {
      checkPopulation[prop] = { populated: false } // leaving room for later in case we need to provide custom validators
    })

    let aggregation = helpers.populateProperties(['reading_id', 'teacher'])
    aggregation.forEach((obj) => {
      if (obj.$addFields) {
        for (let field in obj.$addFields) {
          checkPopulation[field].populated = true
        }
      }
    })

    for (let pop in checkPopulation) {
      checkPopulation[pop].populated.should.be.true
    }
  })

  it('should not populate a property which does not exist', () => {
    helpers.populateProperties(['nothing']).length.should.be.equal(0)
  })

  it('should return an empty array if not passed an array', () => {
    let population = helpers.populateProperties(1234)
    should.exist(population)
    population.should.be.instanceOf(Array)
  })
})