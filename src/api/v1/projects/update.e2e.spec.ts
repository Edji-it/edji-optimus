// library imports
import 'mocha'
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'

import { UserAPI, ProjectAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)

let authToken: string
let userId: any
let projectState: any // keep track of the updates we make to the project along the way

describe("update projects", () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { user, token } = await UserAPI.login(username, password)
    authToken = token
    expect(authToken).not.to.be.undefined
    userId = user._id
    expect(userId).to.not.be.undefined
  })
  before(async () => {
    const project = await ProjectAPI.create({
      teacher_id: userId,
      reading_id: '59bda04985c6ab346c12dbba', // this is not a real project id
      label: 'PUT /api/v1/projects/:project_id test project'
    },
      authToken
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
  describe("PUT /api/v1/projects/:project_id", () => {
    const request = function (projectId: string, body: any, authToken?: string): Request {
      let req = chai.request(data.SERVER)
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
      const expectedUpdatable = ['heat_vision', 'tags', 'report_evals']
      const res = await request(projectState._id, projectState, authToken)
      expect(res).to.have.status(200)
      const returnedUpdated = Object.keys(res.body)
      returnedUpdated.forEach((key) => {
        expect(expectedUpdatable.includes(key), `expected not to be able to update ${key}, but the key was returned from update endpoint`).to.be.true
      })
      expectedUpdatable.forEach((key) => [
        expect(returnedUpdated.includes(key), `expected to be able to update ${key}, but the key was not returned from update endpoint`).to.be.true
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
  describe("PUT /api/v1/projects/:project_id/comments", () => {
    let createdComments = []
    const request = function (projectId: string, body: any, authToken?: string): Request {
      let req = chai.request(data.SERVER)
        .put(`/api/v1/projects/${projectId}/comments`)
        .send(body)

      authToken && req.set('Authorization', authToken)
      return req
    }
    // add at least one comment before all tests so that any test can be successful if run by itself
    before(async () => {
      const comment = {
        user_id: userId,
        start: 5,
        end: 100
      }
      const res = await ProjectAPI.createComment(projectState._id, comment, authToken)
      // just validate we got a good object back from the service
      expect(res).to.have.property('start')
      expect(res.start).to.be.equal(comment.start)
      createdComments.push(res)
    })
    it('should create a new comment with minimal parameters', async () => {
      const minComment = {
        user_id: userId,
        start: 5,
        end: 100
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
        author: 'Corbin', // user's name, stored for easy access
        text: 'important comment text', // the text which the comment is on!
        type: 'emoji', // type of comment (should be required)
        loc: {
          x: 3,
          y: 6
        },
        reply_to: createdComments[0]._id,
        replies: []
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
        end: 100
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
      expect(res).to.have.status(400)
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
    it('should reject edits to a comment if the authenticated user id does not match the user_id of the comment', async () => {
      const { username, password } = data.LOGIN_INFO.API_STUDENT
      const { token } = await UserAPI.login(username, password)
      const commentId = createdComments[0]._id
      // this comment will not have this student's user_id and therefore shouldn't be allowed to be updated
      const commentData = {
        _id: commentId,
        start: 10
      }
      const res = await request(projectState._id, commentData, token)
      expect(res).to.have.status(403)
    })
    it('should reject an unauthorized request', async () => {
      const res = await request(projectState._id, { doesnt_matter: 'nothing' })
      expect(res).to.have.status(401)
    })
  })
})