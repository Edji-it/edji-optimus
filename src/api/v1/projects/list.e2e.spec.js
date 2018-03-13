// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/projects'

describe('GET /projects', () => {
  it('should get a 401 without auth', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL)
    .end((err, res) => {
      should.exist(err)

      res.should.not.have.status(200)
      res.should.have.status(401)
      done()
    })
  })

  it('should get a 400 when requesting with a bad query parameter', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL + "?badparam=nothing")
    .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
    .end((err, res) => {
      should.exist(err)

      res.should.not.have.status(200)
      res.should.have.status(400)
      done()
    })
  })

  let DEFAULT_PROJECT_LIST

  it('should return a list of 15 projects', (done) => {
    chai.request(TEST.SERVER)
    .get(ENDPOINT_URL)
    .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
    .end((err, res) => {
      if (err) { return done(err) }

      res.should.have.status(200)
      res.body.should.have.property('total')
      res.body.total.should.be.above(0)

      res.body.should.have.property('projects')
      const projects = res.body.projects
      res.body.projects.should.be.instanceOf(Array)
      res.body.projects.length.should.equal(15)
      DEFAULT_PROJECT_LIST = projects

      projects.forEach((project) => {
        // things the project SHOULD have
        project.should.have.property("_id")
        project.should.have.property("reading_id")
        project.should.have.property("teacher_id")
        project.should.have.property("label")
        project.should.have.property("code")
        project.should.have.property("types")
        project.should.have.property("tags")
        project.should.have.property("createdAt")
        project.should.have.property("updatedAt")
      })
    })
  })
})