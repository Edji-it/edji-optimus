// library imports
const Q = require('q')

// project imports
const MessageList = require('./../../../../models/MessageList')

// /**
//  * Creates and returns a new message list for the saving - could get more complex in the future and I wanted to test it individually
//  */
// const addNewMessageListToUser = function(user, cb) {
//   // create/save MessageList and update User object with last_message_check_time and message_list_id
//   let messages = MessageList({})
//   messages.save(false, (err, result) => {
//     if (err) {
//       return cb(err) // call the callback with the error
//     }
//     user.message_list_id = result._id
//     user.last_message_check_time = Date.now()
//     user.save(false, (err, result) => {
//       if (err) {
//         return cb(err)
//       } else {
//         cb()
//       }
//     })
//   })
// }

const createMessageList = function(obj) {
  return new Promise((resolve, reject) => {
    if (!obj) {
      return reject(new Error('no object passed to createMessageList'))
    }

    let messages = MessageList(obj)
    messages.save({ forceSave: true }, (err, result) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(result)
      }
    })
  })
}

/**
 * Takes a list and updates/saves a user, returns a Promise
 * @param {MessageList} list the list which needs to be associated with the user
 * @param {User} user the user which needs to be updated with message list info
 */
const addListToUser = function(list, user) {
  return new Promise((resolve, reject) => {
    if (!list || !list._id) {
      return reject('invalid list passed to addListToUser')
    }

    if (!user || !user._id) {
      return reject('invalid user passed to addListToUser')
    }

    user.message_list_id = list._id
    user.last_message_check_time = Date.now()
    user.save(false, (err, result) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(result)
      }
    })
  })
}

module.exports = {
  createMessageList: createMessageList,
  addListToUser: addListToUser
}