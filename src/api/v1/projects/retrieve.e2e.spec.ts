// library imports
import 'mocha'
import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import { UserAPI, ProjectAPI, ReadingAPI, TempUserAPI } from './../../../test/methods'
import data = require('../../../test/constants')

// helper function for validating a project
const validateProject = function (project) {
  project.should.be.instanceOf(Object)

  // check for properties on the main project object
  project.should.have.property("_id")
  project.should.have.property("comments")
  // test comments further
  project.comments.should.be.instanceOf(Array)
  project.should.have.property("answers")
  // test answers further
  project.answers.should.be.instanceOf(Array)
  project.should.have.property("students_ids")
  // test students_ids further
  project.students_ids.should.be.instanceOf(Array)
  project.should.have.property("temp_ids")
  // test temp_ids further
  project.temp_ids.should.be.instanceOf(Array)
  project.should.have.property("types")
  // test types further
  project.types.should.be.instanceOf(Array)
  project.types.length.should.be.equal(4)
  project.should.have.property("report_evals")
  // test report_evals further
  project.report_evals.should.be.instanceOf(Array)
  project.should.have.property("group_instructions")
  project.should.have.property("tags")
  project.should.have.property("createdAt")
  project.should.have.property("updatedAt")
  project.should.have.property("teacher_id")
  project.should.have.property("reading_id")
  project.reading_id.should.not.be.instanceOf(Object)
  project.should.have.property("code")
  project.should.have.property("label")
  project.should.have.property("heat_vision")
  // we didn't ask to populate teacher, so it shouldn't have it!
  project.should.not.have.property("teacher")
}

let teacherToken: string
let teacherObj: any
let createdProject: any
let createdReading: any

// prep for http calls
chai.use(chaiHttp)
const request = function (projectId: string, authToken?: string, query?: string[]): Request {
  let url = `/api/v1/projects/${projectId}`
  if (query) url += `?${query.join('&')}`
  let req = chai.request(data.SERVER)
    .get(url)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('GET /projects/:project_id', () => {
  before(async () => {
    const { username, password } = data.LOGIN_INFO.API_TEACHER
    const { user, token } = await UserAPI.login(username, password)
    teacherToken = token
    expect(teacherToken).not.to.be.undefined
    teacherObj = user
    expect(teacherObj._id).to.exist
  })
  before(async () => {
    const { reading } = await ReadingAPI.create(teacherToken, {
      public: true,
      draft: false
    })
    expect(reading && reading._id).to.exist
    createdReading = reading
    const project = await ProjectAPI.create({
      teacher_id: teacherObj._id,
      reading_id: reading._id,
      label: 'PUT /api/v1/projects/:project_id test project',
      group_instructions: 'dont fold',
      types: ['emoji', 'text', 'audio', 'reply']
    },
      teacherToken
    )
    expect(project._id, 'did not successfully create project to test').not.to.be.undefined
    createdProject = project
  })
  after(async () => {
    const projStatus = await ProjectAPI.delete(createdProject._id, teacherToken) // clean it up
    expect(projStatus, 'test project deletion failed').to.be.equal(204)
    const { results } = await ReadingAPI.delete(createdReading._id, teacherToken)
    expect(results, 'test reading deletion failed').to.have.property('deletedReadings')
    expect(results.deletedReadings, 'test reading deletion failed').to.be.above(0)
  })
  it('should not get a 401 without auth', async () => {
    const res = await request(createdProject._id)
    res.should.have.status(200)

    // check to make sure we get an object back that is the project
    res.body.should.have.property("project")
    const project = res.body.project
    project.should.be.instanceOf(Object)
  })
  it('should return an active project', async () => {
    const res = await request(createdProject._id, teacherToken)
    res.should.have.status(200)

    // check to make sure we get an object back that is the project
    res.body.should.have.property("project")

    validateProject(res.body.project)
  })
  it("should get a project by the project code", async () => {
    const res = await request(createdProject.code, teacherToken)
    expect(res).to.have.status(200)

    // check to make sure we get an object back that is the project
    expect(res.body).to.have.property('project')
    validateProject(res.body.project)
  })
  it("should get a project even if the project code is capitalized", async () => {
    const res = await request(createdProject.code.toUpperCase(), teacherToken)
    res.should.have.status(200)
    res.body.should.have.property("project")
  })
  it('should add a student to the students_ids array', async () => {
    let { username, password } = data.LOGIN_INFO.API_STUDENT
    let { user: studentObj, token } = await UserAPI.login(username, password)
    const res = await request(createdProject._id, token)
    expect(res).to.have.status(200)

    validateProject(res.body.project)
    const project = res.body.project
    expect(project.students_ids.length).to.be.equal(1) // we've added a student now
    const student = project.students_ids.find(id => id === studentObj._id)
    expect(student).to.be.equal(studentObj._id)
  })
  it('should not add a student to the students_ids array twice', async () => {
    let { username, password } = data.LOGIN_INFO.API_STUDENT
    let { user: studentObj, token } = await UserAPI.login(username, password)
    const res = await request(createdProject._id, token)
    expect(res).to.have.status(200)

    validateProject(res.body.project)
    const project = res.body.project
    expect(project.students_ids.length).to.be.equal(1) // we should still only have one unique student added to the project
    const student = project.students_ids.find(id => id === studentObj._id)
    expect(student).to.be.equal(studentObj._id)
  })
  it('should add a temp user to the temp_ids array', async () => {
    const { user, token } = await TempUserAPI.create('testTempUser')
    const res = await request(createdProject._id, token)
    expect(res).to.have.status(200)

    validateProject(res.body.project)
    const project = res.body.project
    expect(project.temp_ids.length).to.be.equal(1) // we should still only have one unique student added to the project
    const student = project.temp_ids.find(id => id === user._id)
    expect(student).to.be.equal(user._id)
  })
  it('should populate reading_id', async () => {
    const res = await request(createdProject._id, teacherToken, ['pop=reading_id'])
    res.should.have.status(200)

    res.body.should.have.property('project')
    res.body.project.should.have.property('reading_id')
    let reading = res.body.project.reading_id

    reading.should.have.property("_id")
    reading.should.have.property("words")
    reading.words.should.be.instanceOf(Array)
    reading.words.length.should.be.above(0)
    reading.should.have.property("title")
    reading.should.have.property("owner_id")
    reading.should.have.property("public")
    reading.should.have.property("promoter_ids")
    reading.should.have.property("source")
    reading.should.have.property("tags")
    reading.should.have.property("draft")
    reading.should.have.property("version_id")
    reading.should.have.property("questions")
    reading.questions.should.be.instanceOf(Array)
  })
  it('should populate teacher', async () => {
    const res = await request(createdProject._id, teacherToken, ['pop=teacher'])
    res.should.have.status(200)

    res.body.should.have.property('project')
    res.body.project.should.have.property('teacher')
    let teacher = res.body.project.teacher

    // test teacher further
    teacher.should.have.property("_id")
    teacher.should.have.property("fullname")
    teacher.should.have.property("username")

    // properties the project object should not have
    res.body.project.should.not.have.property("teacherRef")
    teacher.should.not.have.property("password")
  })
  it('should populate both teacher and reading_id', async () => {
    const res = await request(createdProject._id, teacherToken, ['pop=reading_id', 'pop=teacher'])
    res.should.have.status(200)

    res.body.should.have.property('project')
    res.body.project.should.have.property('reading_id')
    res.body.project.reading_id.should.be.instanceOf(Object)
    res.body.project.should.have.property('teacher')
    res.body.project.teacher.should.be.instanceOf(Object)
  })
  it('should get a 404 for a project that does not exist', async () => {
    const res = await request(teacherObj._id, teacherToken)
    res.should.not.have.status(200)
    res.should.have.status(404)
  })

  it("should return 404 when project is not found by code", async () => {
    const res = await request(Date.now().toString(), teacherToken)
    res.should.not.have.status(200)
    res.should.have.status(404)
  })
})