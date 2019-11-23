// library imports
import request from '../utils/request'
import { iIndexMessage } from 'edji-types'

// constants
const FLAK_TOKEN = process.env.EDJI_FLAK_TOKEN
const FLAK_URL = process.env.EDJI_FLAK_URL

export const indexDocuments = (body: iIndexMessage) => {
  return request({
    url: `${FLAK_URL}/search/_index`,
    method: 'POST',
    body,
    qs: { auth_token: FLAK_TOKEN },
    json: true,
  })
}
