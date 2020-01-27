// library imports
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { pick } from 'underscore'
import { stringify } from 'querystring'

// project imports
import data = require('../../../test/constants')
import { UserAPI, TempUserAPI, ProjectAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(project_id: string, authToken?: string, query?: any) {
  if (!query) query = {}
  let req = chai.request(data.SERVER).get(`/api/v1/projects/${project_id}?${stringify(query)}`)

  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let projectState: any
const TEST_PROJECT_ID = '5cedc568c5581b0021d88097'

describe('GET /api/v1/projects/:project_id', () => {
  before(async () => {
    const { username: createReadingUsername, password: createReadingPassword } = data.LOGIN_INFO.API_TEACHER
    let userRes = await UserAPI.login(createReadingUsername, createReadingPassword)
    authToken = userRes.token
  })
  before(async () => {
    const project = await ProjectAPI.create({}, authToken)
    projectState = project
  })
  after(async () => {
    await ProjectAPI.delete(projectState._id, authToken)
  })
  it('should retrieve an existing project', async () => {
    const constantProperties = [
      'teacher_id',
      'co_owner_ids',
      'reading_id',
      '_id',
      'comments',
      'answers',
      'feedback',
      'students_ids',
      'temp_ids',
      'label',
      'code',
      'types',
      'heat_vision',
      'report_evals',
      'group_instructions',
      'quick_labels',
      'outcomes',
      'createdAt',
    ]
    const res = await request(TEST_PROJECT_ID, authToken)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('project')
    expect(res.body.project)
    const project = res.body.project
    expect(pick(project, constantProperties)).to.deep.equal({
      _id: '5cedc568c5581b0021d88097',
      answers: [
        {
          _id: '5cedc6a4c5581b0021d880a5',
          author: 'changed this!',
          createdAt: '2019-05-28T23:39:16.427Z',
          data: 'A nice answer goes here.',
          dataArray: [],
          end: -1,
          questionId: '5cedc568c5581b0021d8809a',
          replies: [],
          start: -1,
          type: 'text',
          updatedAt: '2019-05-28T23:39:23.487Z',
          user_id: '59bd8ff45239f3001105dba8',
        },
      ],
      co_owner_ids: ['5ab5b2851714720023f12362'],
      code: '2w4k',
      comments: [
        {
          _id: '5cedc63ec5581b0021d8809f',
          author: 'Api',
          createdAt: '2019-05-28T23:37:34.960Z',
          data: 'comment 1',
          dataArray: [],
          end: 2,
          replies: [],
          start: 0,
          text: 'Reading for',
          type: 'text',
          updatedAt: '2019-05-28T23:37:37.260Z',
          user_id: '59bd93955239f3001105dbb0',
        },
        {
          _id: '5cedc65dc5581b0021d880a1',
          author: 'changed this!',
          createdAt: '2019-05-28T23:38:05.596Z',
          data: 'student comment',
          dataArray: [],
          end: 4,
          replies: [],
          start: 0,
          text: 'Reading for retrieve',
          type: 'text',
          updatedAt: '2019-05-28T23:38:38.210Z',
          user_id: '59bd8ff45239f3001105dba8',
        },
      ],
      feedback: [],
      group_instructions: "Do the thing, don't be a bot",
      quick_labels: ['Main Idea', 'Synonym'],
      heat_vision: false,
      label: 'Project for retrieve projects api test',
      outcomes: [],
      reading_id: '5cedc549c5581b0021d88091',
      report_evals: [
        {
          _id: '5cedc73fc5581b0021d880aa',
          createdAt: '2019-05-28T23:41:51.553Z',
          data: 'This is not the type of comment I was looking for when I designed this assignment...',
          recipient_id: '59bd8ff45239f3001105dba8',
          user_id: '59bd93955239f3001105dbb0',
        },
      ],
      students_ids: ['59bd8ff45239f3001105dba8'],
      teacher_id: '59bd93955239f3001105dbb0',
      temp_ids: [],
      types: ['emoji', 'text', 'audio', 'reply'],
      createdAt: '2019-05-28T23:34:00.582Z',
    })
  })
  it('should populate properties', async () => {
    const canPopulate = ['reading_id', 'teacher', 'co_owners']
    const res = await request(TEST_PROJECT_ID, authToken, { pop: canPopulate })
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('project')
    const project = res.body.project
    expect(project).to.haveOwnProperty('reading_id')
    expect(project.reading_id).to.haveOwnProperty('_id')
    expect(project).to.haveOwnProperty('teacher')
    expect(project.teacher).to.deep.equal({
      _id: '59bd93955239f3001105dbb0',
      fullname: 'Api',
      hero_status: true,
      username: 'apiteacher',
    })
    expect(project).to.haveOwnProperty('co_owners')
    expect(project.co_owners).to.deep.equal([
      {
        _id: '5ab5b2851714720023f12362',
        fullname: 'Hero',
        hero_status: true,
        username: 'apitesthero',
      },
    ])
  })
  it('should add a student to the project when it is retrieved', async () => {
    const { username, password } = data.LOGIN_INFO.API_STUDENT
    const { user, token } = await UserAPI.login(username, password)
    const res = await request(projectState._id, token)
    expect(res).to.have.status(200)
    expect(res.body.project.students_ids).to.include(user._id)
  })
  it('should add a temp user to the project when it is retrieved', async () => {
    const { user, token } = await TempUserAPI.create('retrieve reading test')
    const res = await request(projectState._id, token)
    expect(res).to.have.status(200)
    expect(res.body.project.temp_ids).to.include(user._id)
  })
  it('should allow retrieving a project without an auth token', async () => {
    const res = await request(projectState._id)
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('project')
  })
})
