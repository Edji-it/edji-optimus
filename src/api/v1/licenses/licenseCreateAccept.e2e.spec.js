// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

describe('attempt to update user object with license_id and success', () => {
  
  beforeEach((done) => {
    
  })
  afterEach(() => {
    
  })
  // should attempt an update on the user object with a license_id that does exist and their email in the pending_invitations
  // array and get the updated user object in return
  it('should add license_id to the user object upon success', (done) => {
    chai.request(TEST.SERVER)
    .put(ENDPOINT_URL + '5afe2acc9dbfbf137ec0df22/invite') // 
    .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
    .end((err, res) => {
      err && done(err)

      res.should.have.status(200)
      res.body.should.have.property('license')
      let license = res.body.license

      done()
    })
  })
})