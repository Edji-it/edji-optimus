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
        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
  })

  let DEFAULT_PROJECT_LIST

  it('should return a list of projects', (done) => {
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
        DEFAULT_PROJECT_LIST = projects

        let lastProjectDate // used to test that the projects are in sort order from most to least recent
        projects.forEach((project) => {
          // things the project SHOULD have
          project.should.have.property("_id")
          project.should.have.property("reading_id")
          project.should.have.property("teacher_id")
          project.should.have.property("label")
          project.should.have.property("code")
          project.should.have.property("types")
          project.should.have.property("createdAt")
          project.should.have.property("updatedAt")

          project.should.not.have.property("comments")

          let thisProjectDate = new Date(project.createdAt)
          if (lastProjectDate) {
            // test to make sure lastProjectDate is more recent than the current reading
            (lastProjectDate.getTime() >= thisProjectDate.getTime()).should.be.true
          }
          lastProjectDate = thisProjectDate
        })
        should.exist(lastProjectDate)

        done()
      })
  })

  it('should populate readings', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '?pop=reading')
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        if (err) { return done(err) }

        res.body.should.have.property('projects')
        res.body.projects.forEach((project) => {
          // population properties each project should have
          project.should.have.property('reading')
          project.reading.should.have.property('_id')
          project.reading._id.should.be.equal(project.reading_id)
          project.reading.should.have.property('title')

          // populated readings shouldn't have
          project.reading.should.not.have.property('words')
        })

        done()
      })
  })

  it('should populate teachers', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '?pop=teacher')
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        if (err) { return done(err) }

        res.body.should.have.property('projects')
        res.body.projects.forEach((project) => {
          project.should.have.property('teacher')
          project.teacher.should.have.property('_id')
          project.teacher._id.should.be.equal(project.teacher_id)
          project.teacher.should.have.property('fullname')
          project.teacher.should.have.property('email')

          project.teacher.should.not.have.property('password')
        })

        done()
      })
  })

  it('should return 2 projects with ?size=2 query parameter', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '?size=2')
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        if (err) { return done(err) }

        res.body.should.have.property('projects')
        res.body.projects.length.should.be.equal(2)
        res.body.should.have.property('total')
        res.body.total.should.be.above(res.body.projects.length) // just a quick verification that the total is greater than the number of projects returned

        done()
      })
  })

  it('should start at the next index with ?start=1 query parameter', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '?start=1')
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        if (err) { return done(err) }

        res.body.should.have.property('projects')
        res.body.projects[0].should.have.property('_id')
        res.body.projects[0]._id.should.be.equal(DEFAULT_PROJECT_LIST[1]._id)

        done()
      })
  })
})