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
          // test comments further
          project.comments.should.be.instanceOf(Array)
          project.comments.length.should.be.above(0)
        project.should.have.property("answers")
          // test answers further
          project.answers.should.be.instanceOf(Array)
          project.answers.length.should.be.above(0)
        project.should.have.property("students_ids")
          // test students_ids further
          project.students_ids.should.be.instanceOf(Array)
          project.students_ids.length.should.be.above(0)
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
          project.report_evals.length.should.be.above(0)
        project.should.have.property("group_instructions")
        project.should.have.property("tags")
        project.should.have.property("createdAt")
        project.should.have.property("updatedAt")
        project.should.have.property("teacher_id")
        project.should.have.property("reading_id")
          // test reading_id further
          const reading = project.reading_id
          reading.should.have.property("_id")
          reading.should.have.property("words")
            // test words further
            reading.words.should.be.instanceOf(Array)
            reading.words.length.should.be.above(0)
          reading.should.have.property("title")
          reading.should.have.property("owner_id")
          reading.should.have.property("teacher_ids")
          reading.should.have.property("public")
          reading.should.have.property("promoter_ids")
          reading.should.have.property("source")
          reading.should.have.property("tags")
          reading.should.have.property("draft")
          reading.should.have.property("version_id")
          reading.should.have.property("questions")
            // test words further
            reading.questions.should.be.instanceOf(Array)
            reading.questions.length.should.be.above(0)
        project.should.have.property("code")
        project.should.have.property("label")
        project.should.have.property("heat_vision")
        project.should.have.property("teacher")
          // test teacher further
          project.teacher.should.have.property("_id")
          project.teacher.should.have.property("fullname")
          project.teacher.should.have.property("username")

        // properties the project object should not have
        project.should.not.have.property("teacherRef")
        project.should.not.have.property("reading")

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
})