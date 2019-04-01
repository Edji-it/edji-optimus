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
  if (process.env.NODE_ENV === 'production') {
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

export async function sendUserDetails(user: any): Promise<void> {
  try {
    if (user.identities.join('') === 'student') return
    const options: RequestPromiseOptions = {
      headers: { Authorization: process.env.EDJI_BUMBLEBEE_TOKEN },
      body: {
        userDetails: user.toPublic(),
      },
      json: true,
    }
    if (process.env.NODE_ENV === 'production') {
      await post([process.env.EDJI_BUMBLEBEE_DOMAIN, 'newuser'].join('/'), options)
    } else {
      console.log('dev new user message received and stubbed', 'userDetails', options.body.userDetails)
    }
  } catch (err) {
    // for right now, I don't want bumblebee ever interfering with the working logic of a route
    captureException(err)
  }
}
