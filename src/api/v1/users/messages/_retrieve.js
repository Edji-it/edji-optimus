// project imports
const MessageList = require('./../../../../models/MessageList')

/**
 * Creates and returns a new message list for the saving - could get more complex in the future and I wanted to test it individually
 */
const addNewMessageListToUser = function(user, cb) {
  // create/save MessageList and update User object with last_message_check and message_list_id
  let messages = MessageList({})
  messages.save(false, (err, result) => {
    if (err) {
      return cb(err) // call the callback with the error
    }
    user.message_list_id = messages._id
    user.last_message_check = Date.now()
    user.save(false, (err, result) => {
      if (err) {
        return cb(err)
      } else {
        cb()
      }
    })
  })
}

module.exports = {
  addNewMessageListToUser: addNewMessageListToUser
}