// library imports
import 'mocha'
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'

import { UserAPI, ProjectAPI, TempUserAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)

let authToken: string
let userId: any
let fullname: string
let projectState: any // keep track of the updates we make to the project along the way

describe("delete projects", () => {
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
    // find a project _id to use that we can add a comment or answer to (make flexible)
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


  // update for delete project test
  describe("DELETE /api/v1/projects/:project_id", () => {
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
      const expectedUpdatable = ['heat_vision', 'tags', 'report_evals', 'label']
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


  const commentTypes = ['comments', 'answers']
  for (let commentType of commentTypes) {
    describe(`DELETE /api/v1/projects/:project_id/${commentType}/:comment_id`, () => {
      let createdComments = []
      const requestCreate = function (projectId: string, body: any, authToken?: string): Request {
        let req = chai.request(data.SERVER)
          .put(`/api/v1/projects/${projectId}/${commentType}`)
          .send(body)

        authToken && req.set('Authorization', authToken)
        return req
      }
      const requestDelete = (projectId: string, commentType: string, commentId?: string, replyIds?: string[], authToken?: string): Request => {
        // reply _ids are optional, so we add them as array params after comment_id (required)
        let reply_ids: string
        replyIds.forEach((replyId) => {
          reply_ids += `&reply_ids[]=${replyId}`
        })

        let req = chai.request(data.SERVER)
          .del(`/api/v1/projects/${projectId}/${commentType}?comment_id=${commentId}${reply_ids}`)

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
        const res = await ProjectAPI.createComment(projectState._id, comment, authToken, commentType)
        // just validate we got a good object back from the service
        expect(res).to.have.property('start')
        expect(res.start).to.be.equal(comment.start)
        createdComments.push(res)
      })
      it(`should delete a new ${commentType}`, async () => {
        const minComment = {
          user_id: userId,
          start: 5,
          end: 100
        }
        // create a new comment that we'll delete in the next step
        const createRes = await requestCreate(projectState._id, minComment, authToken)
        expect(createRes).to.have.status(200)
        const comment = createRes.body
        expect(comment).to.have.property('_id')

        // delete the newly created comment
        const deleteRes = await requestDelete(projectState._id, `${commentType}`, comment._id, null, authToken)
        expect(deleteRes).to.have.status(200)
      })
      it(`should reject edits to a ${commentType} if the authenticated user id does not match the user_id of the comment`, async () => {
        const { username, password } = data.LOGIN_INFO.API_STUDENT
        const { token } = await UserAPI.login(username, password)
        const commentId = createdComments[0]._id
        // this comment will not have this student's user_id and therefore shouldn't be allowed to be updated
        const commentData = {
          _id: commentId,
          start: 10
        }
        const res = await requestCreate(projectState._id, commentData, token)
        expect(res).to.have.status(403)
      })
      it('should reject an unauthorized request', async () => {
        const res = await requestCreate(projectState._id, { doesnt_matter: 'nothing' })
        expect(res).to.have.status(401)
      })
      
      // this next test only applies to comments, we can't really run it for answers
      if (commentType==='comments') {
        it(`should delete a new ${commentType} that has replies`, async () => {
          
        })
      }
    })
  }
})