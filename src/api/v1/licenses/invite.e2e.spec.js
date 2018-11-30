// library import
const chai = require("chai")
chai.use(require("chai-http"))

// project imports
const TEST = require('../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

describe('PUT /api/v1/licenses/invite', () => {
  let invite_email = 'optimus@prime.ed'

  // should attempt an update on the license object and not pass in a license_id and get the appropriate error message
  it('should get an error when making PUT call and leaving license_id off', (done) => {
    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL + '/123/invite') // this is a call with no id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .send({
        email: invite_email,
        name: "apitesthero2"
      })
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(403)
        done()
      })
  })

  // should attempt an update on the license object with a license_id that doesn't exist and get the appropriate error message
  it('should get an error if license_id does not exist in licenses collection', (done) => {
    let invite_email = 'optimus@prime.ed'

    chai.request(TEST.SERVER)
      .put(ENDPOINT_URL + '5afe2acc9dbfbf137ec0df77/invite') // this is a call with a bad license_id
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .set('Content-Type', 'application/json')
      .send({
        email: invite_email,
        name: "apitesthero2"
      })
      .end((err, res) => {
        res.should.not.have.status(200)
        res.should.have.status(404)
        done()
      })
  })
})