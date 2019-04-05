import * as rp from 'request-promise-native'

export function pipoLog(data: PipoLogData): rp.RequestPromise {
  let pipoUrl: string = process.env.EDJI_PIPO_DOMAIN + '/api/v1/events'

  return rp.post({
    uri: pipoUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.EDJI_PIPO_TOKEN,
    },
    body: JSON.stringify({ data: data }),
  })
}

interface PipoLogData {
  event_name: string
  teacher: boolean
  hero: boolean
  user_id: string
  institution_id?: string
}
