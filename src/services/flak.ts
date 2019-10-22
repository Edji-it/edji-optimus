// library imports
import { post } from 'request-promise-native'
import { iIndexMessage } from 'edji-types'

// constants
const FLAK_TOKEN = process.env.EDJI_FLAK_TOKEN
const FLAK_URL = process.env.EDJI_FLAK_URL

export const indexDocuments = (body: iIndexMessage) => {
  return post({
    uri: `${FLAK_URL}/search/_index`,
    body,
    qs: { auth_token: FLAK_TOKEN },
    json: true,
  })
}
