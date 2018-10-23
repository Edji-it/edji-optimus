// library imports
const chai = require('chai').use(require('chai-as-promised'))
const should = require('chai').should()
const mongoose = require('mongoose')
const sinon = require('sinon')

// project imports
const helpers = require('./_retrieve')
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
    let projectUpdateStub
    beforeEach(() => {
      mockUser = {
        _id: mongoose.Types.ObjectId()
      }
      mockProject = {
        teacher_id: mongoose.Types.ObjectId(),
        students_ids: [
          mongoose.Types.ObjectId(),
          mongoose.Types.ObjectId(),
          mongoose.Types.ObjectId()
        ],
        temp_ids: [
          mongoose.Types.ObjectId(),
          mongoose.Types.ObjectId()
        ]
      }
      projectUpdateStub = sinon.stub(Project.prototype, 'update')
    })

    afterEach(() => {
      projectUpdateStub.restore()
    })

    it('should throw an error if called without a project', async () => {
      await helpers.addIdToProject({}).should.be.rejected
    })

    it('should not update if no user is passed in', async () => {
      let { project, updated } = await helpers.addIdToProject(undefined, mockProject)
      project.should.be.equal(mockProject)
      updated.should.be.false
    })

    it('should not update if the user id is equal to the project id', async () => {
      mockProject.teacher_id = mockUser._id.toString()
      let { project, updated } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      updated.should.be.false
    })

    it('should not update if the user id is already in the students_ids array', async () => {
      mockProject.students_ids.push(mockUser._id)
      let { project, updated } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      updated.should.be.false
    })

    it('should not update if a temp user is already in the temp_ids array', async () => {
      mockUser.type = 'temp'
      mockProject.temp_ids.push(mockUser._id)
      let { project, updated } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      updated.should.be.false
      sinon.assert.notCalled(projectUpdateStub)
    })

    it('should update the project when the user id is not in the students_ids array', async () => {
      let { project, updated } = await helpers.addIdToProject(mockUser, mockProject)
      sinon.assert.calledOnce(projectUpdateStub)
      updated.should.be.true
      project.students_ids.includes(mockUser._id).should.be.true

    })
  })
})