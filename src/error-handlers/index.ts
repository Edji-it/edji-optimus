const Sentry = require('@sentry/node')
import { ErrorRequestHandler } from 'express'

import * as OAuth from './oauth'

export const GeneralErrorHandlers: ErrorRequestHandler[] = [
  OAuth,
  Sentry.Handlers.errorHandler() // sentry docs say this should go first but I have it later because there are some "errors" that I want to handle without sending to sentry
]