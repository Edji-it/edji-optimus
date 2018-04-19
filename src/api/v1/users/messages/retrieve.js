// library imports
const Q = require('q')

// project imports
const MessageList = require('./../../../../models/MessageList')
const helpers = require('./_retrieve')

module.exports = function(req, res) {
  let user = req.user
  console.log(user)

  // throttle the database calls if the user has gotten messages recently
  if (!user.message_check_required) {
    return res.status(200).send({ messages: [] })
  }

  // if the user doesn't have a MessageList, we need to make them one and update their user object
  if(!user.message_list_id) {
    console.log('creating message list')
    helpers.createMessageList({})
    .then((messageList) => {
      return helpers.addListToUser(messageList, user)
    })
    .then((user) => {
      return res.status(200).send({ messages: [] })
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
      // this would be bad - nothing should make this happen... if it is happening, there's a flaw in the system that needs fixed
      if (!messageList) {
        let error = 'no message list exists for user ' + user._id
        console.error(error)
        return res.status(500).send({ error: error })
      }

      if (user.refresh_required) {
        messageList.messages.push({ key: 'user_refresh_required', added_at_time: Date.now() })
      }

      user.last_refresh_time = Date.now()
      user.save(false, (err, res) => {
        err && console.error(err)
      })

      return res.status(200).send({ messages: messageList.messages })
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
  }
}