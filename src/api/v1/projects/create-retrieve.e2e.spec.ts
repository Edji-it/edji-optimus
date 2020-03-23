import * as chai from 'chai'
const expect = chai.expect
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI, ProjectAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const requestProjects = function(authToken: string) {
  let req = chai
    .request(data.SERVER)
    .get(`/api/v1/projects?size=5`)
    .set('Authorization', authToken)

  return req
}

const requestProject = function(projectId: string, authToken: string) {
  let req = chai
    .request(data.SERVER)
    .get(`/api/v1/projects/${projectId}`)
    .set('Authorization', authToken)

  return req
}

describe('create and list projects workflow', () => {
  let heroToken, studentToken, heroUser, createdReading, createdProject
  before(async () => {
    // log in teacher and create new reading with a project
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token, user } = await UserAPI.login(username, password)
    expect(token, 'did not successfully log in teacher').not.to.be.undefined
    heroToken = token
    heroUser = user
    let { reading } = await ReadingAPI.create(heroToken)
    createdReading = reading
    createdProject = await ProjectAPI.create(
      {
        reading_id: createdReading._id,
        teacher_id: heroUser._id,
        label: 'create and list projects workflow',
      },
      heroToken,
    )
    let { username: studentUsn, password: studentPw } = data.LOGIN_INFO.API_STUDENT
    let res = await UserAPI.login(studentUsn, studentPw)
    studentToken = res.token
  })

  it('should list a project in a users dashboard after the user joins the project', async function() {
    this.timeout(6000)
    // make sure the new reading does not already exist on the dashboard
    let res1 = await requestProjects(studentToken)
    res1.body.projects.length.should.be.above(1)
    res1.body.projects.forEach(project => {
      project._id.should.not.be.equal(createdProject._id)
    })

    // make call to get project from student
    await requestProject(createdProject._id, studentToken)

    // check to make sure it appears on the student's dashboard
    let res2 = await requestProjects(studentToken)
    res2.body.projects.length.should.be.above(1)
    let projectFound: boolean = false
    res2.body.projects.forEach(project => {
      if (project._id === createdProject._id) {
        projectFound = true
      }
    })
    projectFound.should.be.true
  })
})
