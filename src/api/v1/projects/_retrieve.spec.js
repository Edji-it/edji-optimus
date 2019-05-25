// library imports
const chai = require('chai').use(require('chai-as-promised'))
const should = chai.should()
const mongoose = require('mongoose')

// project imports
const helpers = require('./_retrieve')

describe('projects _retrieve', () => {
  describe('populateProperties', () => {
    it('should return an array', () => {
      helpers.populateProperties().should.be.instanceOf(Array)
    })

    it('should populate all possible properties', () => {
      let possibleProperties = ['reading_id', 'teacher', 'co_owners']

      let checkPopulation = {}
      possibleProperties.forEach(prop => {
        checkPopulation[prop] = { populated: false } // leaving room for later in case we need to provide custom validators
      })

      let aggregation = helpers.populateProperties(possibleProperties)
      aggregation.forEach(obj => {
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
      mockUser = {
        _id: mongoose.Types.ObjectId(),
      }
      mockProject = {
        teacher_id: mongoose.Types.ObjectId(),
        students_ids: [mongoose.Types.ObjectId(), mongoose.Types.ObjectId(), mongoose.Types.ObjectId()],
        temp_ids: [mongoose.Types.ObjectId(), mongoose.Types.ObjectId()],
      }
    })

    it('should throw an error if called without a project', async () => {
      return await helpers.addIdToProject({}).should.be.rejected
    })

    it('should not update if no user is passed in', async () => {
      let { project, update } = await helpers.addIdToProject(undefined, mockProject)
      project.teacher_id.should.be.equal(mockProject.teacher_id)
      project.should.be.equal(mockProject)
      should.not.exist(update)
    })

    it('should not update if the user id is equal to the project id', async () => {
      mockProject.teacher_id = mockUser._id.toString()
      let { project, update } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      should.not.exist(update)
    })

    it('should not update if the user id is already in the students_ids array', async () => {
      mockProject.students_ids.push(mockUser._id)
      let { project, update } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      should.not.exist(update)
    })

    it('should not update if a temp user is already in the temp_ids array', async () => {
      mockUser.type = 'temp'
      mockProject.temp_ids.push(mockUser._id)
      let { project, update } = await helpers.addIdToProject(mockUser, mockProject)
      project.should.be.equal(mockProject)
      should.not.exist(update)
    })

    it('should return a valid update when the user id is not in the students_ids array', async () => {
      let { project, update } = await helpers.addIdToProject(mockUser, mockProject)
      update.should.be.instanceOf(Object)
      update.should.have.property('$push')
      update.$push.should.have.property('students_ids')
      update.$push.students_ids.should.be.equal(mockUser._id)
      project.students_ids.includes(mockUser._id).should.be.true
    })

    it('should return a valid update when the temp user id is not in the temp_ids array', async () => {
      mockUser.type = 'temp'
      let { project, update } = await helpers.addIdToProject(mockUser, mockProject)
      update.should.be.instanceOf(Object)
      update.should.have.property('$push')
      update.$push.should.have.property('temp_ids')
      update.$push.temp_ids.should.be.equal(mockUser._id)
      project.temp_ids.includes(mockUser._id).should.be.true
    })
  })

  describe('decorateProject', () => {
    let comments = []
    for (let i = 0; i < 20; i++) {
      comments.push({ _id: mongoose.Types.ObjectId() })
    }
    // give comment 0 three comments
    comments[1].reply_to = comments[0]._id
    comments[2].reply_to = comments[0]._id
    comments[3].reply_to = comments[0]._id

    // give comment 7 two comments
    comments[8].reply_to = comments[7]._id
    comments[9].reply_to = comments[7]._id

    let mockProject
    beforeEach(() => {
      mockProject = {
        comments: comments,
      }
    })

    it('should return the project', () => {
      let result = helpers.decorateProject(mockProject)
      result.should.be.equal(mockProject)
    })

    it('should add a replies array to comments with replies', () => {
      let commentsWithReplies = [{ index: 0, count: 3 }, { index: 7, count: 2 }]
      helpers.decorateProject(mockProject)

      commentsWithReplies.forEach(testData => {
        let comment = mockProject.comments[testData.index]
        comment.should.have.property('replies')
        comment.replies.should.be.instanceOf(Array)
        comment.replies.length.should.be.equal(testData.count)
      })
    })
  })
})
