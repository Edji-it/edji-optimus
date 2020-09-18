import { RequestHandler } from 'express'
import request from '../../../utils/request'

const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_IMMERSIVE_READER_SUBDOMAIN } = process.env

export const azureAuth: RequestHandler = async (req, res, next) => {
  // reference materials here: https://docs.microsoft.com/en-us/azure/cognitive-services/immersive-reader/quickstarts/client-libraries?pivots=programming-language-nodejs
  const data = await request({
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    url: `https://login.windows.net/${AZURE_TENANT_ID}/oauth2/token`,
    form: {
      grant_type: 'client_credentials',
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      resource: 'https://cognitiveservices.azure.com/',
    },
  })
  const { error, access_token } = data
  if (error) {
    return res.status(500).send({ error })
  }
  return res.status(200).send({ access_token, subdomain: AZURE_IMMERSIVE_READER_SUBDOMAIN })
}
