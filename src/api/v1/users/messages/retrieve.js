// library imports
const Q = require('q')

// project imports
const MessageList = require('./../../../../models/MessageList')
const helpers = require('./_retrieve')

module.exports = function(req, res) {
  let user = req.user
  const MESSAGE_CHECK_INTERVAL = 1000 * 60 * 1 // 1 minute

  // throttle the database calls if the user has gotten messages recently
  if (user.last_message_check && user.last_message_check > Date.now() - MESSAGE_CHECK_INTERVAL) {
    return res.status(200).send({ messages: [] })
  }

  // if the user doesn't have a MessageList, we need to make them one and update their user object
  if(!user.last_message_check || !user.message_list_id) {
    helpers.addNewMessageListToUser(user, (err) => {
      if (err) {
        console.error(err)
        return res.status(500).send()
      } else {
        return res.status(200).send({ messages: [] })
      }
    })
  } else {
    Q(
      MessageList.findById(user.message_list_id).exec()
    )
    .then((messageList) => {
      return res.status(200).send({ messages: messageList.messages })
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
  }
}