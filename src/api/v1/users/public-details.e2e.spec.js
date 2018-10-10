// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/users/public-details'
const ONE_STUDENT = "?students_ids=59bd945b5239f3001105dbb6&temp_ids="
const ONE_TEMP = "?students_ids=&temp_ids=59bda03b85c6ab346c12dba0"
const ONE_STUDENT_ONE_TEMP = "?students_ids=59bd945b5239f3001105dbb6&temp_ids=59bda03b85c6ab346c12dba0"
const TWO_STUDENT_ONE_TEMP = "?students_ids=59bd945b5239f3001105dbb6,59bd93955239f3001105dbb0&temp_ids=59bda03b85c6ab346c12dba0"
const EMPTY_REQUEST = "?students_ids=&temp_ids="
const BAD_REQUEST = "?students="

describe('GET /users/public-details', () => {
  it('should get a 401 without auth', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + ONE_STUDENT)
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(401)
        done()
      })
  })

  it('should get a 400 for a request that does not have any _ids', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + EMPTY_REQUEST)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
  })

  it('should return user info for one student', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + ONE_STUDENT)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        err && done(err)
        res.should.have.status(200)

        // check to make sure we get an object back that is the user
        res.body.should.have.property("users")
        const users = res.body.users
        users.should.be.instanceOf(Array)
        users.length.should.be.equal(1)

        // user object info should have the following properties
        const user = users[0]
        user.should.have.property("_id")
        user.should.have.property("fullname")
        user.should.have.property("username")
        user.should.have.property("userType")
        user.userType.should.be.equal("registered")

        done()
      })
  })
})