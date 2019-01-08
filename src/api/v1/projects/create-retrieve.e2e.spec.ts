import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI, ReadingAPI, ProjectAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const requestProjects = function (authToken: string) {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/projects?size=5`)
    .set('Authorization', authToken)

  return req
}

const requestProject = function (projectId: string, authToken: string) {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/projects/${projectId}`)
    .set('Authorization', authToken)

  return req
}

// TODO test to see if the reading comes back on the user who create it's dashboard

describe('create and list projects workflow', () => {
  it('should list a project in a user\'s dashboard after the user joins the project', async () => {
    // log in teacher and create new reading with a project
    let { username: heroUsn, password: heroPw } = data.LOGIN_INFO.API_HERO
    let { token: heroToken } = await UserAPI.login(heroUsn, heroPw)
    let { reading: createdReading } = await ReadingAPI.create(heroToken)
    let { project: createdProject } = await ProjectAPI.create(
      {
        reading_id: createdReading._id,
        label: 'create and list projects workflow'
      },
      heroToken
    )

    // log in student and make sure the new reading does not already exist on the dashboard
    let { username: studentUsn, password: studentPw } = data.LOGIN_INFO.API_STUDENT
    let { token: studentToken } = await UserAPI.login(studentUsn, studentPw)
    let res1 = await requestProjects(studentToken)
    res1.body.projects.should.be.above(1)
    res1.body.projects.forEach((project) => {
      project._id.equals(createdProject._id).should.be.false
    })

    // make call to get project from student
    await requestProject(createdProject._id, studentToken)

    // check to make sure it appears on the student's dashboard
    let res2 = await requestProjects(studentToken)
    res2.body.projects.should.be.above(1)
    let projectFound: boolean = false
    res2.body.projects.forEach((project) => {
      if (project._id.equals(createdProject._id)) {
        projectFound = true
      }
    })
    projectFound.should.be.true
  })
})