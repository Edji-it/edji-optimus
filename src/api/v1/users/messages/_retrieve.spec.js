// package imports
const chai = require('chai')
const sinon = require('sinon')
const mongoose = require('mongoose')
// require('sinon-mongoose')

// local imports
const helpers = require('./_retrieve')
const MessageList = require('./../../../../models/MessageList').default

describe('_retrieve messages', () => {
  // it does not make sense to have this method attached directly to the _retrieve route, but I don't know how to test it otherwise
  //  once I figure that out, it should be moved.
  describe('createMessageList', () => {
    let messageStub
    beforeEach(() => {
      messageStub = sinon.stub(MessageList.prototype, 'edjiSave')
    })
    afterEach(() => {
      messageStub.restore()
    })

    it('should save a MessageList', done => {
      let list = { _id: mongoose.Types.ObjectId() }
      messageStub.resolves(list)

      helpers
        .createMessageList(list)
        .then(result => {
          result.should.have.property('_id')
          result._id.should.be.equal(list._id)

          sinon.assert.calledOnce(messageStub)

          done()
        })
        .catch(err => {
          err && done(err)
        })
    })

    it('should return error if no object passed in', done => {
      helpers
        .createMessageList()
        .then(() => {
          sinon.assert.notCalled(messageStub)
          return done(new Error('should not have resolved'))
        })
        .catch(() => {
          return done()
        })
    })
  })

  describe('addListToUser', () => {
    // set up a fake user w/ a save function to be stubbed
    let userStub
    let user
    let list = {
      _id: mongoose.Types.ObjectId(),
    }
    beforeEach(() => {
      user = {
        _id: mongoose.Types.ObjectId(),
        edjiSave: () => {}, // need a function to stub out
      }
      userStub = sinon.stub(user, 'edjiSave')
    })
    afterEach(() => {
      userStub.restore()
    })

    it('should update a user', done => {
      userStub.resolves(user) // set stub to return user

      helpers
        .addListToUser(list, user)
        .then(result => {
          sinon.assert.calledOnce(userStub)
          result.should.have.property('message_list_id')
          result.message_list_id.should.be.equal(list._id)
          result.should.have.property('last_message_check_time')

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should throw an error if called without a list', done => {
      helpers
        .addListToUser({}, user)
        .then(() => {
          done(new Error('should not have resolved'))
        })
        .catch(err => {
          done()
        })
    })

    it('should throw an error if called without a user', done => {
      helpers
        .addListToUser(list, {})
        .then(() => {
          done(new Error('should not have resolved'))
        })
        .catch(err => {
          done()
        })
    })
  })
})
