// library imports
import { post, RequestPromiseOptions } from 'request-promise-native'
import { captureException } from '@sentry/node'

/**
 * IMPORTANT: bumblebee MUST be invited to the channel you want the message to appear in
 *  (Slack doesn't let bots join channels automatically)
 * @param {string} message the message you want Optimus to post to the channel
 * @param {string} toChannel the channel you want to post a message to
 */
export async function sendMessage(message: string, toChannel: string = 'metric-bots'): Promise<void> {
  if (process.env.EDJI_STAGE === 'production') {
    const options: RequestPromiseOptions = {
      headers: { Authorization: process.env.EDJI_BUMBLEBEE_TOKEN },
      body: {
        message,
        toChannel,
      },
      json: true,
    }
    await post([process.env.EDJI_BUMBLEBEE_DOMAIN, 'messages'].join('/'), options)
  } else {
    console.log({
      system: 'dev message received and stubbed',
      message: message,
      toChannel: toChannel,
    })
  }
}
