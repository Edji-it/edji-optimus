// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/projects/'

describe('GET /projects/:project_id', () => {
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

  // it('should return a list of projects', (done) => {
    
  // })

  // it('should populate readings', (done) => {
    
  // })

  // it('should populate teachers', (done) => {
    
  // })

  // it('should return 2 projects with ?size=2 query parameter', (done) => {
    
  // })

  // it('should start at the next index with ?start=1 query parameter', (done) => {
    
  // })
})