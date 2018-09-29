// library imports
const rp = require('request-promise')

/**
 * IMPORTANT: bumblebee MUST be invited to the channel you want the message to appear in
 *  (Slack doesn't let bots join channels automatically)
 * @param {string} message the message you want Optimus to post to the channel
 * @param {string} toChannel the channel you want to post a message to
 */
const sendMessage = function (message, toChannel = 'metric-bots') {
  // if we're not in production, just log the message instead of sending
  if (process.env.NODE_ENV !== 'production') {
    console.log({
      system: 'dev message received and stubbed',
      message: message,
      toChannel: toChannel
    })

    return Promise.resolve({ success: true })
  }

  const options = {
    method: 'POST',
    uri: [process.env.EDJI_BUMBLEBEE_DOMAIN, "messages"].join("/"),
    headers: { Authorization: process.env.EDJI_BUMBLEBEE_TOKEN },
    body: {
      message,
      toChannel
    },
    json: true
  }

  return rp(options)
}

module.exports = {
  sendMessage
}