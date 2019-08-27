// library import
const chai = require('chai')
chai.use(require('chai-http'))

// project imports
const TEST = require('../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

describe('PUT /api/v1/licenses/accept', () => {
  // should attempt an update on the user object and not pass in a license_id and get the appropriate error message
  it('should get an error when making put call and leaving license_id off', done => {
    chai
      .request(TEST.SERVER)
      .put(ENDPOINT_URL + '/59bda3de709c57353bab8b8b/accept') // this is a call with no id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(403)
        done()
      })
  })

  // should attempt an update on the user object with a license_id that doesn't exist and get the appropriate error message
  it('should get an error if license_id does not exist in licenses collection', done => {
    chai
      .request(TEST.SERVER)
      .put(ENDPOINT_URL + '5afe2acc9dbfbf137ec0df77/accept') // this is a call with a bad license_id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(403)
        done()
      })
  })

  // should attempt an update on the user object with a license_id that does exist, but should not have an email in the
  // pending_invitations array and get the appropriate error message
  it('should get an error if email does not exist in pending_invitations array for the given license', done => {
    chai
      .request(TEST.SERVER)
      .put(ENDPOINT_URL + '5afe2acc9dbfbf137ec0df22/accept') // this is a call with a good license_id, but the user's email is not in the pending_invitations
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(403)
        done()
      })
  })
})
