// library imports
import 'mocha'
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

import { UserAPI, ProjectAPI, TempUserAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)

let authToken: string
let userId: any
let createdProject: any

describe("delete projects", () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { user, token } = await UserAPI.login(username, password)
    authToken = token
    expect(authToken).not.to.be.undefined
    userId = user._id
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
    createdProject = project
  })

  // update for delete project test
  describe("DELETE project /api/v1/projects/:project_id", () => {
    const requestCreate = async function (body: any, authToken?: string) {
      return ProjectAPI.create(body, authToken)
    }

    const requestDelete = function (projectId: string, authToken?: string): Request {
      let req = chai.request(data.SERVER)
        .del(`/api/v1/projects/${projectId}`)

      authToken && req.set('Authorization', authToken)
      return req
    }
    it('should delete a project', async () => {
      let createBody = {
        teacher_id: userId,
        reading_id: '59bda04985c6ab346c12dbba', // this is not a real project id
        label: 'PUT /api/v1/projects/:project_id test project'
      }
      // create a fresh project to delete
      const createProj = await requestCreate(createBody, authToken)
      expect(createProj).to.have.property('_id')
      expect(createProj._id).not.to.be.undefined
      
      // delete the project that we just created above
      const deleteProj = await requestDelete(createProj._id, authToken)
      expect(deleteProj).to.have.status(204)
    })
    it('should receive a 400 if passed an invalid project id', async () => {
      const res = await requestDelete('invalid_id', authToken)
      expect(res).to.have.status(400)
    })
    it('should reject an unauthorized request', async () => {
      const res = await requestDelete('invalid_id', '')
      expect(res).to.have.status(401)
    })
    it('should return 404 if requesting to delete a project which does not exist', async () => {
      const res = await requestDelete('59bda04985c6ab346c12dbba', authToken)
      expect(res).to.have.status(404)
    })
    it('should return 404 if the user is attempting to delete a real project which they do not own', async () => {
      let { username, password } = data.LOGIN_INFO.API_HERO
      let { token } = await UserAPI.login(username, password)
      expect(token).not.to.be.undefined
      const res = await requestDelete(createdProject._id, token)
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
        let reply_ids: string = ''
        replyIds && replyIds.forEach((replyId) => {
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
        const res = await ProjectAPI.createComment(createdProject._id, comment, authToken, commentType)
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
        const createRes = await requestCreate(createdProject._id, minComment, authToken)
        expect(createRes).to.have.status(200)
        const comment = createRes.body
        expect(comment).to.have.property('_id')

        // delete the newly created comment
        const deleteRes = await requestDelete(createdProject._id, `${commentType}`, comment._id, [], authToken)
        expect(deleteRes).to.have.status(204)
      })
      it(`should reject delete request to a ${commentType} if the authenticated user id does not match the user_id of the comment`, async () => {
        const { username, password } = data.LOGIN_INFO.API_STUDENT
        const { token } = await UserAPI.login(username, password)
        const commentId = createdComments[0]._id
        const res = await requestDelete(createdProject._id, `${commentType}`, commentId, [], token)
        expect(res).to.have.status(403)
      })
      it('should reject an unauthorized request', async () => {
        const res = await requestDelete(createdProject._id, `${commentType}`, 'fakeId', [], null)
        expect(res).to.have.status(401)
      })
      // this next test only applies to comments, we can't really run it for answers
      if (commentType==='comments') {
        it(`should delete a new ${commentType} that has replies`, async () => {
          const minComment = {
            user_id: userId,
            start: 5,
            end: 100
          }
          // need to set the reply_to to the comment _id above once we add it to the project in the call below
          const minReply = {
            user_id: userId,
            reply_to: '', 
            start: 5,
            end: 100
          }
          // create a new comment that we'll delete in the final step
          const createRes = await requestCreate(createdProject._id, minComment, authToken)
          expect(createRes).to.have.status(200)
          const comment = createRes.body
          expect(comment).to.have.property('_id')
          minReply.reply_to = comment._id

          // create a new reply comment to the parent comment above that we'll delete in the final step
          const createReplyRes = await requestCreate(createdProject._id, minReply, authToken)
          expect(createReplyRes).to.have.status(200)
          const reply = createReplyRes.body
          expect(reply).to.have.property('_id')
          expect(reply).to.have.property('reply_to')
  
          // delete the newly created comment
          const deleteRes = await requestDelete(createdProject._id, `${commentType}`, comment._id, [reply._id], authToken)
          expect(deleteRes).to.have.status(204)
        })
      }
    })
  }
})