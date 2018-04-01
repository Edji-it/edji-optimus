// library imports
const Q = require('q')

// project imports
const MessageList = require('./../../../../models/MessageList')
const helpers = require('./_retrieve')

module.exports = function(req, res) {
  let user = req.user

  // throttle the database calls if the user has gotten messages recently
  if (!user.message_check_required) {
    return res.status(200).send({ messages: [] })
  }

  // if the user doesn't have a MessageList, we need to make them one and update their user object
  if(!user.message_list_id) {
    // helpers.addNewMessageListToUser(user, (err) => {
    //   if (err) {
    //     console.error(err)
    //     return res.status(500).send()
    //   } else {
    //     return res.status(200).send({ messages: [] })
    //   }
    // })
    helpers.createMessageList({})
    .then((messageList) => {
      
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
  } else {
    Q(
      MessageList.findById(user.message_list_id).exec() // call for just the json object - not the mongoose wrapped object
    )
    .then((messageList) => {
      if (user.refresh_required) {
        messageList.messages.push({ key: 'user_refresh_required', added_at_time: Date.now() })
      }
      return res.status(200).send({ messages: messageList.messages })
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
  }
}