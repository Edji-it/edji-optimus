// library import
const chai = require("chai")
const should = chai.should()
chai.use(require("chai-http"))

// project imports
const TEST = require('./../../../../../_test')

// local variables
let getEndpointUrl = function(userId) {
  return '/api/v1/users/' + userId + '/messages'
}
// const HERO_ID = 
// const HERO2_ID 

describe('GET /users/:user_id/messages', () => {
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

  // not completely sure how to test
  // it('should tell a user to be refreshed if they have not been in the last 1/2 day', (done) => {
  //   chai.request(TEST.SERVER)
  //   .get(ENDPOINT_URL)
  //   .set('Authorization', TEST.LOGIN_TOKENS.API_HERO2) // don't use this user in the GET /user/:user_id tests or this will fail because it will be refreshed
  //   .end((err, res) => {
  //     if (err) { return done(err) }

  //     console.log('got response')

  //     res.should.have.status(200)
  //     res.body.should.have.property('messages')
  //     res.body.messages.should.be.instanceOf(Array)

  //     let refreshMessage = res.body.messages.find((message) => {
  //       return message.key === 'user_refresh_required'
  //     })
  //     should.exist(refreshMessage) // check that message exists
      
  //     done()
  //   })
  // })
})