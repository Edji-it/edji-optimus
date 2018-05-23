import * as rp from 'request-promise'

export class DataLogger {
  public static pipoLog: (data: PipoLogData) => rp.RequestPromise = function(data: PipoLogData) {
    return rp({
      method: 'POST',
      url: process.env.EDJI_PIPO_DOMAIN + '/api/v1/events',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.EDJI_PIPO_TOKEN
      },
      body: { data: data }
    })
  }
}

export interface PipoLogData {
  event_name: string
  teacher: boolean
  hero: boolean
  user_id: string
  institution_id?: string
}