// library imports
const chai = require('chai')
const should = require('chai').should()
const mongoose = require('mongoose')

// project imports
const helpers = require('./_retrieve')
const User = require('./../../../models/User')
const Project = require('./../../../models/Project')

describe('projects _retrieve', () => {
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

  describe('addIdToProject', () => {
    let mockProject
    let mockUser
    beforeEach(() => {
      mockUser = User({
        _id: mongoose.Types.ObjectId()
      })
    })

    it('should throw an error if called without a project', (done) => {
      helpers.addIdToProject({})
        .then(() => {
          done('resolved when an error should have been thrown')
        })
        .catch(() => {
          done()
        })
    })

    it('should not update if no user is passed in', (done) => {
      helpers.addIdToProject(undefined, {})
        .then(({ project, updated }) => {
          project.should.be.equal
        })
    })
  })
})