// library import
const chai = require("chai")
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../_test')

// local variables
const ENDPOINT_URL = '/api/v1/referrals'

describe('GET /api/v1/referrals/:referral_code', () => {
  it('should get a users fullname without authentication', (done) => {
    let requestCode = 'ct8zh'

    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '/' + requestCode)
      .end((err, res) => {
        err && done(err)

        res.should.have.status(200)
        res.body.should.have.property('user')
        let user = res.body.user

        let propertiesToCheck = [
          'fullname'
        ]

        // make sure that more properties than intended are not being returned
        for (let key in user) {
          propertiesToCheck.indexOf(key).should.be.above(-1)
        }

        done()
      })
  })
})