// library imports
import { RequestHandler } from 'express'
import { verify, sign } from 'jsonwebtoken'
import { compare } from 'bcryptjs'
import { captureException } from '@sentry/node'

// project impors
import TempUser from './../models/TempUser'
import User, { iUser } from '../models/User'
import { addUserToScope } from './sentry'

const passwordSecret = process.env.OPTIMUS_PW_SECRET

/**
 * Login function for a user logging in
 * @param param0 object with username and password for a user object
 */
export const login = async function({ username, password }) {
  username = username.toLowerCase().trim()
  const dbUser = await User.findOne({
    $or: [{ username: username }, { email: username }],
  })
  if (!dbUser || !dbUser.password) throw { status: 401 }
  const match = await comparePasswords(password, dbUser.password)
  if (match) {
    return dbUser
  } else {
    throw { status: 401 }
  }
}

export const comparePasswords = function(stringPass: string, hashedPass: string): Promise<boolean> {
  return compare(stringPass, hashedPass)
}

export const generateLoginObjectForUser = function(user: any) {
  const objectToSign: DecodedJWT = { id: user._id }
  if (user.type) objectToSign.type = user.type

  return {
    user: user.toPublic(),
    token: sign(objectToSign, passwordSecret),
  }
}

/**
 * @param authHeader the authorization header from the request
 * @param projection a mongodb projection, used to recall only a part of the user object
 * @returns a mongoose User object!
 */
export const decodeTokenToUser = (authHeader: string, projection: any = {}): Promise<any> => {
  const jwt: DecodedJWT = <DecodedJWT>verify(authHeader, passwordSecret) // syncronously decode token
  if (!jwt) throw new Error('invalid token')

  const model = jwt.type === 'temp' ? TempUser : User

  return model
    .findByIdAndUpdate(
      jwt.id,
      { $set: { last_action_time: Date.now() } },
      { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false },
    )
    .select(projection)
    .exec()
}

export const middleware: RequestHandler = async (req, res, next) => {
  if (!req.headers.authorization) return next()
  try {
    const user = await decodeTokenToUser(req.headers.authorization)
    req.user = req.context.user = user
    await addUserToScope(user)
    next()
  } catch (err) {
    return next(err)
  }
}

export const LegacyAuth = middleware

/**
 * @param projection a mongodb projection to use when recalling the user
 */
export const addUserToRequest: (projection?: UserProjection) => RequestHandler = (projection = { type: true }) => {
  return async (req, res, next) => {
    if (!req.headers.authorization) return next()
    try {
      const user = await decodeTokenToUser(req.headers.authorization, projection)
      req.user = req.context.user = user
      await addUserToScope(user)
      next()
    } catch (err) {
      return next(err)
    }
  }
}

interface DecodedJWT {
  id: string
  type?: string
}

type UserProjection = Projection<iUser>

type Projection<T> = { [P in keyof T]?: boolean }
