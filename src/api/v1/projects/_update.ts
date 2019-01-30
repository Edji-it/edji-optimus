import { del } from 'request-promise-native'
import { captureException } from '@sentry/node'

/**
 * Sets up the options and returns a promise which will call grapple's route to delete an asset from s3
 * @param url The url of the asset to delete (typically looks like //images.edji.it/something)
 * @returns Promise resolved with a response body from Grapple
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    const options = {
      uri: [process.env.EDJI_GRAPPLE_DOMAIN, "v1", "s3", encodeURIComponent(url)].join("/"),
      headers: { Authorization: process.env.EDJI_GRAPPLE_TOKEN },
      json: true
    }
    const res = await del(options)
  } catch (err) {
    captureException(err)
  }
}