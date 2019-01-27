// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('../../../test/constants')

// local variables
const ENDPOINT_URL = '/api/v1/licenses/'

describe('GET /api/v1/licenses/', () => {
  // should get a 200 response from the server which means we got all licenses for that user
  it('should GET all licenses for the test user', function (done) {
    this.timeout(6000)
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL)
      .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2)
      .end((err, res) => {
        res.should.have.status(200)

        res.body.should.have.property('licenses')
        let licenses = res.body.licenses
        licenses.should.be.instanceOf(Array)
        licenses.length.should.be.above(0)

        let heroLicense = licenses.find((license) => {
          return license.license_type === 'hero'
        })
        should.exist(heroLicense)
        heroLicense.should.have.property('_id')
        heroLicense.should.have.property('max_users')
        heroLicense.max_users.should.be.gt(0)
        heroLicense.should.have.property('pending_invitations')
        heroLicense.pending_invitations.should.be.instanceOf(Array)
        heroLicense.should.have.property('roles')
        heroLicense.should.have.property('owning_institution')
        heroLicense.should.have.property('users')
        heroLicense.users.should.be.instanceOf(Array)
        heroLicense.users.length.should.be.above(0)
        heroLicense.should.have.property('createdAt')
        heroLicense.should.have.property('updatedAt')

        let firstUser = heroLicense.users[0]
        firstUser.should.have.property('_id')
        firstUser.should.have.property('username')
        firstUser.should.have.property('fullname')
        firstUser.should.have.property('email')
        firstUser.should.have.property('identities')
        // firstUser.should.have.property('last_hero_check')
        firstUser.should.have.property('hero_status')
        firstUser.should.have.property('license_ids')
        firstUser.should.have.property('institution_ids')
        firstUser.should.have.property('updatedAt')
        firstUser.should.have.property('createdAt')

        done()
      })
  })

  // should get a 404 response from the server which means we could not find any licenses for that user
  it('should get an error when attempting to GET all licenses for the test user', (done) => {
    chai.request(TEST.SERVER)
      .get(ENDPOINT_URL + '')
      .set('Authorization', TEST.LOGIN_TOKENS.API_STUDENT)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property('licenses')
        res.body.licenses.length.should.be.equal(0)
        done()
      })
  })
})