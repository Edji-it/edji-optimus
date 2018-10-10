// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')
const PROJECT = TEST.PROJECT_REF.TEST_PROJECT.project_id
const BAD_PROJECT = TEST.PROJECT_REF.BAD_PROJECT.project_id

// local variables
const ENDPOINT_URL = '/api/v1/projects/'

describe('GET /projects/:project_id', () => {
  it('should get a 401 without auth', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + PROJECT)
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(401)
        done()
      })
  })

  it('should return an active project', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + PROJECT)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        if (err) { return done(err) }
        res.should.have.status(200)

        // check to make sure we get an object back that is the project
        res.body.should.have.property("project")
        const project = res.body.project
        project.should.be.instanceOf(Object)

        // check for properties on the main project object
        project.should.have.property("_id")
        project.should.have.property("comments")
        project.should.have.property("answers")
        project.should.have.property("students_ids")
        project.should.have.property("temp_ids")
        project.should.have.property("types")
        project.should.have.property("report_evals")
        project.should.have.property("group_instructions")
        project.should.have.property("tags")
        project.should.have.property("createdAt")
        project.should.have.property("updatedAt")
        project.should.have.property("teacher_id")
        project.should.have.property("reading_id")
        project.should.have.property("code")
        project.should.have.property("label")
        project.should.have.property("heat_vision")
        project.should.have.property("teacher")

        done()
      })
  })

  it('should get a 404 for a project that does not exist', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + BAD_PROJECT)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(404)
        done()
      })
  })

  // it('should populate teachers', (done) => {
    
  // })

  // it('should return 2 projects with ?size=2 query parameter', (done) => {
    
  // })

  // it('should start at the next index with ?start=1 query parameter', (done) => {
    
  // })
})