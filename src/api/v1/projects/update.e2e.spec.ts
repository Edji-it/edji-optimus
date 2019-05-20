// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'

// project imports
import { UserAPI, ProjectAPI, TempUserAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)

let authToken: string
let userId: string
let fullname: string
let projectState: any // keep track of the updates we make to the project along the way

describe('PUT /api/v1/projects/:project_id handlers', () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { user, token } = await UserAPI.login(username, password)
    authToken = token
    expect(authToken).not.to.be.undefined
    userId = user._id
    fullname = user.fullname
    expect(userId).to.not.be.undefined
  })
  before(async () => {
    const project = await ProjectAPI.create(
      {
        teacher_id: userId,
        reading_id: '59bda04985c6ab346c12dbba', // this is not a real project id
        label: 'PUT /api/v1/projects/:project_id test project',
        co_owner_ids: [],
      },
      authToken,
    )
    expect(project._id, 'did not successfully create project to test').not.to.be.undefined
    projectState = project
  })
  afterEach(async () => {
    const { project } = await ProjectAPI.retrieve(projectState._id, authToken)
    expect(project._id).to.be.equal(projectState._id) // just verify we got back the project we expected
    projectState = project // make sure projectState is consistent with the database after every test
  })
  after(async () => {
    const status = await ProjectAPI.delete(projectState._id, authToken) // clean it up
    expect(status, 'test project deletion failed').to.be.equal(204)
  })
  describe('PUT /api/v1/projects/:project_id', () => {
    const request = function(projectId: string, body: any, authToken?: string): Request {
      let req = chai
        .request(data.SERVER)
        .put(`/api/v1/projects/${projectId}`)
        .send(body)

      authToken && req.set('Authorization', authToken)
      return req
    }
    it('should update a single property on a project', async () => {
      const initialValue = projectState.heat_vision
      const res = await request(projectState._id, { heat_vision: !initialValue }, authToken)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('heat_vision')
      expect(res.body.heat_vision).not.to.be.equal(initialValue)
    })
    it('should return the state of all updatable properties', async () => {
      const expectedUpdatable = ['heat_vision', 'tags', 'report_evals', 'label', 'co_owner_ids']
      const res = await request(projectState._id, projectState, authToken)
      expect(res).to.have.status(200)
      const returnedUpdated = Object.keys(res.body)
      returnedUpdated.forEach(key => {
        expect(
          expectedUpdatable.includes(key),
          `expected not to be able to update ${key}, but the key was returned from update endpoint`,
        ).to.be.true
      })
      expectedUpdatable.forEach(key => [
        expect(
          returnedUpdated.includes(key),
          `expected to be able to update ${key}, but the key was not returned from update endpoint`,
        ).to.be.true,
      ])
    })
    it('should return 400 if the request does not send any properties to update', async () => {
      const res = await request(projectState._id, {}, authToken)
      expect(res).to.have.status(400)
    })
    it('should return 400 if the request is not attempting to update any updatable properties', async () => {
      const res = await request(projectState._id, { non_esiste: 'this doesnt exist bro' }, authToken)
      expect(res).to.have.status(400)
    })
    it('should receive a 400 if passed an invalid project id', async () => {
      const res = await request('abcdefg', { heat_vision: true }, authToken)
      expect(res).to.have.status(400)
    })
    it('should reject an unauthorized request', async () => {
      const res = await request(projectState._id, { heat_vision: true })
      expect(res).to.have.status(401)
    })
    it('should return 404 if requesting to update a project which does not exist', async () => {
      const res = await request(userId, { heat_vision: true }, authToken)
      expect(res).to.have.status(404)
    })
    it('should return 404 if the user is attempting to update a real project which they do not own', async () => {
      let { username, password } = data.LOGIN_INFO.API_HERO
      let { token } = await UserAPI.login(username, password)
      expect(token).not.to.be.undefined
      const res = await request(projectState._id, { heat_vision: true }, token)
      expect(res).to.have.status(404)
    })
  })

  // so wrapping describe statements in a loop like this works, even with grepping through test statements
  const commentTypes = ['comments', 'answers']
  for (let commentType of commentTypes) {
    describe(`PUT /api/v1/projects/:project_id/${commentType}`, () => {
      let createdComments = []
      const request = function(projectId: string, body: any, authToken?: string): Request {
        let req = chai
          .request(data.SERVER)
          .put(`/api/v1/projects/${projectId}/${commentType}`)
          .send(body)

        authToken && req.set('Authorization', authToken)
        return req
      }
      // add at least one comment before all tests so that any test can be successful if run by itself
      before(async () => {
        const comment = {
          user_id: userId,
          start: 5,
          end: 100,
        }
        const res = await ProjectAPI.createComment(projectState._id, comment, authToken, commentType)
        // just validate we got a good object back from the service
        expect(res).to.have.property('start')
        expect(res.start).to.be.equal(comment.start)
        createdComments.push(res)
      })
      it('should create a new comment with minimal parameters', async () => {
        const minComment = {
          user_id: userId,
          start: 5,
          end: 100,
        }
        const res = await request(projectState._id, minComment, authToken)
        expect(res).to.have.status(200)
        const comment = res.body
        expect(comment).to.have.property('_id')
        expect(comment).to.have.property('user_id')
        expect(comment.user_id).to.be.equal(minComment.user_id)
        expect(comment).to.have.property('start')
        expect(comment.start).to.be.equal(minComment.start)
        expect(comment).to.have.property('end')
        expect(comment.end).to.be.equal(minComment.end)
        expect(comment).to.have.property('author')
        expect(comment.author).to.be.equal(fullname)
        expect(comment).to.have.property('updatedAt')
        expect(comment).to.have.property('createdAt')
        createdComments.push(comment)
      })
      it('should create a new comment with all the properties', async () => {
        const maxComment = {
          user_id: userId,
          start: 5,
          end: 100,
          data: 'a data here',
          dataArray: ['here is more data'],
          url: 'https://edji.it',
          author: fullname, // user's name, stored for easy access
          text: 'important comment text', // the text which the comment is on!
          type: 'emoji', // type of comment (should be required)
          loc: {
            x: 3,
            y: 6,
          },
          reply_to: createdComments[0]._id,
          replies: [],
          questionId: new ObjectId().toHexString(),
        }
        const res = await request(projectState._id, maxComment, authToken)
        expect(res).to.have.status(200)
        const comment = res.body
        expect(comment).to.have.property('_id')
        expect(comment).to.have.property('user_id')
        expect(comment.user_id).to.be.equal(maxComment.user_id)
        expect(comment).to.have.property('start')
        expect(comment.start).to.be.equal(maxComment.start)
        expect(comment).to.have.property('end')
        expect(comment.end).to.be.equal(maxComment.end)
        expect(comment).to.have.property('data')
        expect(comment.data).to.be.equal(maxComment.data)
        expect(comment).to.have.property('data')
        expect(comment.data).to.be.equal(maxComment.data)
        expect(comment).to.have.property('dataArray')
        expect(comment.dataArray[0]).to.be.equal(maxComment.dataArray[0])
        expect(comment).to.have.property('url')
        expect(comment.url).to.be.equal(maxComment.url)
        expect(comment).to.have.property('author')
        expect(comment.author).to.be.equal(maxComment.author)
        expect(comment).to.have.property('text')
        expect(comment.text).to.be.equal(maxComment.text)
        expect(comment).to.have.property('type')
        expect(comment.type).to.be.equal(maxComment.type)
        expect(comment).to.have.property('loc')
        expect(comment.loc.x).to.be.equal(maxComment.loc.x)
        expect(comment.loc.y).to.be.equal(maxComment.loc.y)
        expect(comment).to.have.property('reply_to')
        expect(comment.reply_to).to.be.equal(maxComment.reply_to)
        expect(comment).to.have.property('questionId')
        expect(comment.questionId).to.be.equal(maxComment.questionId)
        expect(comment).to.have.property('replies')
        expect(comment.replies.length).to.be.equal(maxComment.replies.length)
        expect(comment).to.have.property('updatedAt')
        expect(comment).to.have.property('createdAt')
        createdComments.push(comment)
      })
      it('should create a new comment if the _id of the comment that was passed does not exist in the comments array', async () => {
        const commentData = {
          _id: new ObjectId().toHexString(),
          user_id: userId,
          start: 5,
          end: 100,
        }
        const res = await request(projectState._id, commentData, authToken)
        expect(res).to.have.status(200)
        const comment = res.body
        expect(comment).to.have.property('_id')
        expect(comment._id).to.be.equal(commentData._id)
        createdComments.push(comment)
      })
      it('should reject a comment that does not have required properties', async () => {
        const res = await request(projectState._id, { data: 'haha this wont work' }, authToken)
        expect(res).to.have.status(406)
        expect(res.body).to.have.property('validationErrors')
      })
      it('should update an existing comment if passed an id', async () => {
        let testedComments = 0
        for (let i = 0; i < createdComments.length; i++) {
          const comment = createdComments[i]
          if (comment.user_id !== userId) continue // get out of this loop if we're going to get a 401 because of unmatched user_id's
          const body = { _id: comment._id, data: Date.now().toString() }
          const res = await request(projectState._id, body, authToken)
          expect(res).to.have.status(200)
          expect(res.body).to.have.property('_id')
          expect(res.body._id).to.be.equal(body._id)
          expect(res.body).to.have.property('data')
          expect(res.body.data).to.be.equal(body.data)
          expect(res.body).to.have.property('start') // test that it's returning at least one property that we didn't just submit in the update
          testedComments++
        }
        expect(testedComments, 'did not attempt to update any comments').to.be.greaterThan(0)
      })
      it('should reject edits to a comment if the user is not an owner or co_owner', async () => {
        const { username, password } = data.LOGIN_INFO.API_STUDENT
        const { token } = await UserAPI.login(username, password)
        const commentId = createdComments[0]._id
        // this comment will not have this student's user_id and therefore shouldn't be allowed to be updated
        const commentData = {
          _id: commentId,
          start: 10,
        }
        const res = await request(projectState._id, commentData, token)
        expect(res).to.have.status(403)
      })
      it('should reject an unauthorized request', async () => {
        const res = await request(projectState._id, { doesnt_matter: 'nothing' })
        expect(res).to.have.status(401)
      })
    })
  }
  describe('PUT /api/v1/projects/:project_id/students', () => {
    let studentUser, studentToken
    before(async () => {
      const { username, password } = data.LOGIN_INFO.API_STUDENT
      const { user, token } = await UserAPI.login(username, password)
      expect(user._id).to.exist
      studentUser = user
      expect(token).to.exist
      studentToken = token
    })
    const request = function(projectId: string, authToken?: string): Request {
      let req = chai
        .request(data.SERVER)
        .put(`/api/v1/projects/${projectId}/students`)
        .send({})

      authToken && req.set('Authorization', authToken)
      return req
    }
    it('should add a student to a project', async () => {
      const res = await request(projectState._id, studentToken)
      expect(res).to.have.status(200)
      expect(res.body).to.have.property('_id')
      expect(res.body._id).to.be.equal(studentUser._id)
      // verify the student was actually added to the project, intentionally call w/ teacher's token
      const { project } = await ProjectAPI.retrieve(projectState._id, authToken)
      expect(project).to.have.property('students_ids')
      expect(project.students_ids).to.include(studentUser._id)
    })
    it('should not add a student to a project twice', async () => {
      const res = await request(projectState._id, studentToken)
      expect(res).to.have.status(404)
    })
    it('should not add a teacher to their own project', async () => {
      const res = await request(projectState._id, authToken)
      expect(res).to.have.status(404)
    })
    it('should add a temp student to a project', async () => {
      const { user: tempUser, token: tempToken } = await TempUserAPI.create('testTempUser')
      expect(tempUser).to.exist
      expect(tempToken).to.exist
      const res = await request(projectState._id, tempToken)
      expect(res).to.have.status(200)
      expect(res.body._id).to.be.equal(tempUser._id)
      // verify the student was actually added to the project, intentionally call w/ teacher's token
      const { project } = await ProjectAPI.retrieve(projectState._id, authToken)
      expect(project).to.have.property('temp_ids')
      expect(project.temp_ids).to.include(tempUser._id)
    })
    it('should get a 404 for a project which does not exist', async () => {
      const res = await request(userId, authToken)
      expect(res).to.have.status(404)
    })
    it('should reject an unauthenticated request', async () => {
      const res = await request(projectState._id)
      expect(res).to.have.status(401)
    })
  })
  describe('PUT /api/v1/projects/:project_id/feedback', () => {
    const feedbackObject = {
      outcome_id: '5c50f4c20b944f00963beb59',
      feedback_to: '5c55f320844a4f0040845788',
      evaluation: 'Good job!',
    }
    const invalidFeedback = {
      outcome_id: '5c50f4c20b944f00963beb59',
      feedback_to: '5c55f320844a4f0040845788',
    }
    const request = function(projectId: string, feedback: any, authToken?: string): Request {
      let req = chai
        .request(data.SERVER)
        .put(`/api/v1/projects/${projectId}/feedback`)
        .send(feedback)

      authToken && req.set('Authorization', authToken)
      return req
    }
    it('should add feedback', async () => {
      const res = await request(projectState._id, feedbackObject, authToken)
      expect(res).to.have.status(200)
      const feedback = res.body
      expect(feedback).to.have.property('outcome_id')
      expect(feedback).to.have.property('feedback_to')
      expect(feedback).to.have.property('evaluation')
    })
    it('should modify the feedback', async () => {
      // we need the _id for the feedback object
      expect(projectState).to.have.property('feedback')
      const feedbackArray = projectState.feedback
      expect(feedbackArray).to.be.length.greaterThan(0)
      let feedbackObj = feedbackArray[feedbackArray.length - 1]

      const evalStr = `eval-${Date.now()}`
      feedbackObj.evaluation = evalStr

      const res = await request(projectState._id, feedbackObj, authToken)
      expect(res).to.have.status(200)
      const feedback = res.body
      expect(feedback).to.have.property('outcome_id')
      expect(feedback).to.have.property('feedback_to')
      expect(feedback).to.have.property('_id')
      expect(feedback).to.have.property('evaluation')
      const evaluation = feedback.evaluation
      expect(evaluation).to.equal(evalStr)
    })
    it('should let a co_owner add feedback', async () => {
      const { username, password } = data.LOGIN_INFO.API_HERO
      const { token } = await UserAPI.login(username, password)
      // make apitesthero a co owner
      await ProjectAPI.update(projectState._id, { co_owner_ids: ['5ab5b2851714720023f12362'] }, authToken)
      expect(projectState.feedback).to.be.length.greaterThan(0)
      const feedback = projectState.feedback[0]
      const res = await request(projectState._id, feedback, token)
      expect(res).to.have.status(200)
    })
    it('should not let a random user add feedback', async () => {
      const { username, password } = data.LOGIN_INFO.API_STUDENT
      const { token } = await UserAPI.login(username, password)
      expect(projectState.feedback).to.be.length.greaterThan(0)
      const feedback = projectState.feedback[0]
      const res = await request(projectState._id, feedback, token)
      expect(res).to.have.status(403)
    })
    it('should get a 406 for an invalid request', async () => {
      const res = await request(projectState._id, invalidFeedback, authToken)
      expect(res).to.have.status(406)
    })
    it('should get a 404 for a project which does not exist', async () => {
      const res = await request(userId, feedbackObject, authToken)
      expect(res).to.have.status(404)
    })
    it('should reject an unauthenticated request', async () => {
      const res = await request(projectState._id, feedbackObject)
      expect(res).to.have.status(401)
    })
  })
})
