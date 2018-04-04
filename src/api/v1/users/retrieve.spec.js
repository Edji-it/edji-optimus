// package imports
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const mongoose = require('mongoose')
const mockExpress = require('sinon-express-mock')

// project imports
const retrieve = require('./retrieve')

describe('GET /api/v1/users/:user_id retrieve handler', () => {
  let user = {
    _id: mongoose.Types.ObjectId(),
    checkHeroStatus: function() {},
    save: function() {}
  }
  let saveUserStub = sinon.stub(user, 'save')
  let checkHeroStatusStub = sinon.stub(user, 'checkHeroStatus')
  let req = mockExpress.mockReq()
  let res = mockExpress.mockRes()

  beforeEach(() => {
    // reset stubs/mocks
    saveUserStub.reset()
    checkHeroStatusStub.reset()
    req.reset()
    res.reset()

    user = {
      _id: mongoose.Types.ObjectId(),
      checkHeroStatus: checkHeroStatusStub,
      save: saveUserStub
    }
    req.user = user
  })

  afterEach(() => {
    saveUserStub.restore()
    checkHeroStatusStub.restore()
    req.restore()
    res.restore()
  })

  it('should not fail tests and stuff', () => {
    retrieve(req, res)

    sinon.assert.calledOnce(saveUserStub)
  })
})