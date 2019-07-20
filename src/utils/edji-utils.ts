// library imports
import { RequestHandler, IRouterHandler, IRouterMatcher, IRouter } from 'express'
import { post, RequestPromiseOptions } from 'request-promise-native'
import onHeaders = require('on-headers')
import { v4 } from 'uuid'
import { captureException } from '@sentry/node'

const LOGS_ENDPOINT: string = [process.env.EDJI_FLAK_URL || 'https://flak-dev.edji.it', 'logs', 'edji'].join('/')

export function addRouteName(name: string): RequestHandler {
  return (req, res, next) => {
    if (!req.context.routeName) {
      req.context.routeName = ''
    }
    req.context.routeName += name
    next()
  }
}

export class EdjiUtils {
  appId: string
  env: string
  //  default local logging to false - will be true for dev
  doLog: boolean = process.env.NODE_ENV === 'production'
  requestIdHeader: string = 'X-Request-Id'
  requestTimeHeader: string = 'X-Response-Time'
  constructor({ appId, env, doLog }: UtilOptions) {
    this.appId = appId
    this.env = env || process.env.NODE_ENV
    if (doLog === true) this.doLog = true
  }

  /**
   * adds request time and id to headers
   * if logs are turned on, sends log to Flak
   */
  attachLogs: RequestHandler = (req, res, next) => {
    try {
      const startTime = process.hrtime()
      const requestIdHeader: string = <string>res.getHeader(this.requestIdHeader)
      const request_id: string = requestIdHeader || v4()
      if (!requestIdHeader) res.setHeader(this.requestIdHeader, request_id)
      res.setHeader('X-Powered-By', 'Autobots')
      res.setHeader('X-Optimus-Version', process.env.npm_package_version)
      const _this = this
      // this hook gets called right before the request is sent, so that we'll know how long the request took
      onHeaders(res, function() {
        const diff = process.hrtime(startTime)
        const request_time = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 1e3) / 1e3
        this.setHeader(_this.requestTimeHeader, request_time + 'ms')
        if (_this.doLog) {
          const log: EdjiLog = {
            app_id: _this.appId,
            env: _this.env,
            method: req.method,
            status: res.statusCode,
            action: 'route_log',
            timestamp: new Date(),
            ip: req.ip,
            url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
            route_name: req.context.routeName,
            request_id,
            request_time,
            heroku: process.env.HEROKU_RELEASE_VERSION,
          }
          if (req.user && req.user._id) {
            if (typeof req.user._id === 'object') {
              log.user_id = req.user._id.toString()
            } else if (typeof req.user._id === 'string') {
              log.user_id = req.user._id
            }
          }
          _this.sendLog(log)
        }
      })
    } catch (err) {
    } finally {
      next()
    }
  }

  private sendLog = async (body: EdjiLog): Promise<void> => {
    const options: RequestPromiseOptions = {
      body,
      headers: {
        'content-type': 'application/json',
      },
      auth: {
        bearer: process.env.EDJI_FLAK_TOKEN,
      },
      json: true,
    }

    try {
      await post(LOGS_ENDPOINT, options)
    } catch (err) {
      process.env.NODE_ENV === 'local' && console.error(err.body)
      captureException(err)
    }
  }

  initContext: RequestHandler = (req, res, next) => {
    req.context = {}
    res.body = {}
    next()
  }
}

interface UtilOptions {
  appId: string // the name that will identify the app in the logs
  env?: string // defaults to the NODE_ENV if nothing is passed explicitly
  doLog?: boolean // option for turning off logging if desired
}

interface EdjiLog {
  app_id: string
  env: string
  method: string
  status: number
  action: string
  timestamp: Date
  ip: string
  url: string
  request_id: string
  request_time: number
  heroku: string
  user_id?: string
  [key: string]: any
}
