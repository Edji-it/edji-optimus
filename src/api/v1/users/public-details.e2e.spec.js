// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/users/public-details'
const ONE_STUDENT = "?students_ids[]=59bd945b5239f3001105dbb6&temp_ids[]="
const ONE_TEMP = "?students_ids[]=&temp_ids[]=59bda03b85c6ab346c12dba0"
const ONE_STUDENT_ONE_TEMP = "?students_ids[]=59bd945b5239f3001105dbb6&temp_ids[]=59bda03b85c6ab346c12dba0"
const TWO_STUDENT_ONE_TEMP = "?students_ids[]=59bd945b5239f3001105dbb6&students_ids[]=59bd93955239f3001105dbb0&temp_ids[]=59bda03b85c6ab346c12dba0"
const EMPTY_REQUEST = "?students_ids[]=&temp_ids[]="
const BAD_REQUEST = "?students[]="

describe('GET /users/public-details', () => {
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

  it('should get a 400 for a bad request', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + BAD_REQUEST)
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

  it('should return user info for one temp', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + ONE_TEMP)
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
        user.should.have.property("userType")
        user.userType.should.be.equal("temp")

        done()
      })
  })

  it('should return user info for one student and one temp', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + ONE_STUDENT_ONE_TEMP)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        err && done(err)
        res.should.have.status(200)

        // check to make sure we get an object back that is the user
        res.body.should.have.property("users")
        const users = res.body.users
        users.should.be.instanceOf(Array)
        users.length.should.be.equal(2)

        // user object info should have the following properties
        const user = users[0]
        user.should.have.property("_id")
        user.should.have.property("fullname")
        user.should.have.property("username")
        user.should.have.property("userType")
        user.userType.should.be.equal("registered")

        // temp object info should have the following properties
        const temp = users[1]
        temp.should.have.property("_id")
        temp.should.have.property("fullname")
        temp.should.have.property("userType")
        temp.userType.should.be.equal("temp")

        done()
      })
  })

  it('should return user info for two students and one temp', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + TWO_STUDENT_ONE_TEMP)
      .set('Authorization', TEST.LOGIN_TOKENS.API_TEACHER)
      .end((err, res) => {
        err && done(err)
        res.should.have.status(200)

        // check to make sure we get an object back that is the user
        res.body.should.have.property("users")
        const users = res.body.users
        users.should.be.instanceOf(Array)
        users.length.should.be.equal(3)

        // user object info should have the following properties
        const user1 = users[0]
        user1.should.have.property("_id")
        user1.should.have.property("fullname")
        user1.should.have.property("username")
        user1.should.have.property("userType")
        user1.userType.should.be.equal("registered")

        // user object info should have the following properties
        const user2 = users[1]
        user2.should.have.property("_id")
        user2.should.have.property("fullname")
        user2.should.have.property("username")
        user2.should.have.property("userType")
        user2.userType.should.be.equal("registered")

        // temp object info should have the following properties
        const temp = users[2]
        temp.should.have.property("_id")
        temp.should.have.property("fullname")
        temp.should.have.property("userType")
        temp.userType.should.be.equal("temp")

        done()
      })
  })
})