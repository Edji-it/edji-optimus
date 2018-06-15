// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'
var LICENSE_ID = ''

describe('license create, add invite, and accept invite success', () => {
  // before we get too far, we'll need to create a new license to test off of
  it('should add a new license to the collection', (done) => {
  chai.request(TEST.SERVER)
    .post(ENDPOINT_URL + '') // send a post call to create a new license
    .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
    .set('Content-Type', 'application/json')
    .send({
      license : {
        license_type: "hero",
        owning_institution: "5b006d759dbfbf137ec0df23",
        max_users: 10,
        roles : [ 
	        {
	            user_id : "5afe25eef839555366ab959c",
	            role : "owner"
	        }
	      ]
      }
    })
    .end((err, res) => {
      err && done(err)

      res.should.have.status(200)
      res.body.should.have.property('license')

      let license = res.body.license
      license.should.have.property('_id')
      
      LICENSE_ID = license._id

      done()
    })
  })

  // should add an email address and expiration date to the license
  it('should add email and expiration date to license object upon success', (done) => {
    let invite_email = 'optimus@prime.ed'
    
    chai.request(TEST.SERVER)
    .put(ENDPOINT_URL + LICENSE_ID + '/invite') // send a put to the license_id to add email to pending_invitations
    .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
    .set('Content-Type', 'application/json')
    .send({email: invite_email})
    .end((err, res) => {
      err && done(err)

      res.should.have.status(200)
      res.body.should.have.property('license')

      let license = res.body.license
      license.should.have.property('pending_invitations')

      let pending_invitation = license.pending_invitations[license.pending_invitations.length-1]
      pending_invitation.should.have.property('email')
      pending_invitation.should.have.property('expiration')
      pending_invitation.email.should.be.equal(invite_email)

      done()
    })
  })

  // should attempt an update on the user object with a license_id that does exist and their email in the pending_invitations
  // array and get the updated user object in return
  it('should update the user with the new license_id and clear out the email address from the pending_invitation', (done) => {
    chai.request(TEST.SERVER)
    .put(ENDPOINT_URL + LICENSE_ID + '/accept') // send a put to the license_id to add email to pending_invitations
    .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
    .end((err, res) => {
      err && done(err)

      res.should.have.status(200)
      res.body.should.have.property('user')

      let user = res.body.user
      user.should.have.property('license_ids')

      let license_ids = user.license_ids
      license_ids.should.have.length.above(0)

      license_ids.should.include(LICENSE_ID)

      done()
    })
  })
})