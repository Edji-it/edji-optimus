import * as Sentry from '@sentry/node'
import { RewriteFrames } from '@sentry/integrations'

export const initSentry = () => {
  const sentryParams: Sentry.NodeOptions = {
    dsn: 'https://c581687e3838434b859f1249b31d5a26@sentry.io/299438',
    environment: process.env.EDJI_STAGE,
  }
  const release = require('../../scripts/get-release-id')()
  if (release) {
    Object.assign(sentryParams, {
      release,
      integrations: [new RewriteFrames({ root: global['__rootdir__'] })],
    })
  }
  Sentry.init(sentryParams)
}

export const sentryRequestHandler = Sentry.Handlers.requestHandler

export const addUserToScope: (user: any) => Promise<void> = user => {
  return new Promise(resolve => {
    if (!user) return resolve()
    const { _id, type } = user
    Sentry.configureScope(scope => {
      scope.setUser({ _id, type })
      return resolve()
    })
  })
}

export const addPropertiesToScope: (data: { [key: string]: string }) => Promise<void> = data => {
  return new Promise(resolve => {
    if (!data) return resolve()
    Sentry.configureScope(scope => {
      for (const key in data) {
        scope.setTag(key, data[key])
      }
      return resolve()
    })
  })
}
