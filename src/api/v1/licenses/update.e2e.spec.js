// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'
const NO_LICENSE_ID = "accept"
const BAD_LICENSE_ID = "5afe2acc9dbfbf137ec0df77/accept"

describe('update', () => {
  describe('attempt to update user object with license_id and error out', () => {
    // should attempt an update on the user object and not pass in a license_id and get the appropriate error message
    it('should get an error when making put call and leaving license_id off', (done) => {
      chai.request(TEST.SERVER)
      .put(ENDPOINT_URL + NO_LICENSE_ID) // this is a call with no id
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(400)
        done()
      })
    })

    // should attempt an update on the user object with a license_id that doesn't exist and get the appropriate error message
    it('should get an error if license_id does not exist in licenses collection', (done) => {
      chai.request(TEST.SERVER)
      .put(ENDPOINT_URL + BAD_LICENSE_ID) // this is a call with a bad license_id
      .end((err, res) => {
        should.exist(err)

        res.should.not.have.status(200)
        res.should.have.status(403)
        done()
      })
    })

    // NEED LICENSE CREATE/UPDATE ROUTES TO TEST THIS:
    // should attempt an update on the user object with a license_id that does exist, but should not have an email in the 
    // pending_invitations array and get the appropriate error message
    // it('should get an error if email does not exist in pending_invitations array for the given license', (done) => {

    // })
  })

  // NEED LICENSE CREATE/UPDATE ROUTES TO TEST THIS:
  // describe('attempt to update user object with license_id and success', () => {
    
  //   beforeEach(() => {
      
  //   })
  //   afterEach(() => {
      
  //   })
  //   // should attempt an update on the user object with a license_id that does exist and their email in the pending_invitations
  //   // array and get the updated user object in return
  //   it('should add license_id to the user object upon success', (done) => {

  //   })
  // })
})