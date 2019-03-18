// library imports
import { RequestHandler } from 'express'
import { post, RequestPromiseOptions } from 'request-promise-native'
import onHeaders = require('on-headers')

// const onHeaders = require('on-headers')
// const genUUID = require('uuid/v4')
import { v4 } from 'uuid'

const LOGS_ENDPOINT: string = [process.env.EDJI_FLAK_URL, 'logs', 'edji'].join('/')

async function sendLog(body: EdjiLog): Promise<void> {
  // const body: EdjiLog = {
  //   app_id: 'optimus',
  //   env: process.env.NODE_ENV,
  //   action: 'log',
  //   timestamp: new Date(),
  //   ip: '0.0.0.0',
  //   url: req.url,
  //   request_id: '12345',
  //   request_time: 10,
  //   status: 200
  // }
  const options: RequestPromiseOptions = {
    body,
    headers: {
      'content-type': 'application/json'
    },
    auth: {
      bearer: process.env.EDJI_FLAK_TOKEN
    },
    json: true
  }

  try {
    const res = await post(LOGS_ENDPOINT, options)
    console.log(res)
  } catch (err) {
    console.error(err.error)
    if (err.statusCode === 500) {
    }
  }
}

const middleware: RequestHandler = (req, res, next) => {
  const startTime = process.hrtime()
  const uuid = v4()
  if (!res.getHeader('X-Request-Id')) res.setHeader('X-Request-Id', uuid)
  onHeaders(res, function () {
    const diff = process.hrtime(startTime)
    const time = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3)
    this.setHeader('X-Response-Time', time)
  })
  next()
}

interface EdjiLog {
  app_id: string
  env: string
  action: string
  timestamp: Date
  ip: string
  url: string
  status: number
  request_id: string
  request_time: number
}