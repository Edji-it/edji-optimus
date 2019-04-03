// library imports
const Sentry = require('@sentry/node')

// project imports
import { ErrorRequestHandler } from 'express'
import { OAuthMiddleware } from './oauth'
import { handleMongoValidationMiddleware } from './mongo-validation'

export const GeneralErrorHandlers: ErrorRequestHandler[] = [
  handleMongoValidationMiddleware,
  OAuthMiddleware,
  Sentry.Handlers.errorHandler(), // sentry docs say this should go first but I have it later because there are some "errors" that I want to handle without sending to sentry
]

export * from './mongo-validation'
