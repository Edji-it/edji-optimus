// library imports

// project imports
const MessageList = require('./../../../../models/MessageList').default

const createMessageList = async function(obj) {
  if (!obj) {
    return reject(new Error('no object passed to createMessageList'))
  }

  let messages = MessageList(obj)
  return messages.edjiSave()
}

/**
 * Takes a list and updates/saves a user, returns a Promise
 * @param {MessageList} list the list which needs to be associated with the user
 * @param {User} user the user which needs to be updated with message list info
 */
const addListToUser = async function(list, user) {
  if (!list || !list._id) {
    return reject('invalid list passed to addListToUser')
  }

  if (!user || !user._id) {
    return reject('invalid user passed to addListToUser')
  }

  user.message_list_id = list._id
  user.last_message_check_time = Date.now()
  return user.edjiSave()
}

module.exports = {
  createMessageList: createMessageList,
  addListToUser: addListToUser,
}
