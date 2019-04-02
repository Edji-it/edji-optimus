// library imports
import { RequestHandler } from 'express'
import { verify, sign } from 'jsonwebtoken'
import { compare } from 'bcryptjs'
import { captureException } from '@sentry/node'

// project impors
import * as TempUser from './../models/TempUser'
import * as User from './../models/User'

const passwordSecret = process.env.OPTIMUS_PW_SECRET

/**
 * Login function for a user logging in
 * @param param0 object with username and password for a user object
 */
export const login = async function ({ username, password }) {
  username = username.toLowerCase().trim()
  const dbUser = await User.findOne({
    $or: [
      { username: username },
      { email: username }
    ]
  })
  if (!dbUser || !dbUser.password) throw { status: 401 }
  const match = await comparePasswords(password, dbUser.password)
  if (match) {
    const { user, token } = generateLoginObjectForUser(dbUser)
    if (!user || !token) {
      throw { status: 401 }
    } else if (user && !token) {
      captureException(`got user object but not token for id: ${user._id}`)
      throw { status: 500 }
    }
    return { user, token }
  } else {
    throw { status: 401 }
  }
}

export const comparePasswords = function (stringPass: string, hashedPass: string): Promise<boolean> {
  return compare(stringPass, hashedPass)
}

export const generateLoginObjectForUser = function (user: any) {
  const objectToSign: DecodedJWT = { id: user._id }
  if (user.type) objectToSign.type = user.type

  return {
    user: user.toPublic(),
    token: sign(objectToSign, passwordSecret)
  }
}

/**
 * @param authHeader the authorization header from the request
 * @returns a mongoose User object!
 */
export const decodeTokenToUser = function (authHeader: string): Promise<any> {
  const userJWT: DecodedJWT = <DecodedJWT>verify(authHeader, passwordSecret) // syncronously decode token
  if (userJWT.type === "temp") {
    return TempUser.findByIdAndUpdate(
      userJWT.id,
      { $set: { last_action_time: Date.now() } },
      { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false }
    )
  } else if (userJWT) {
    // set their last action time! Whoo this is so exciting!
    return User.findByIdAndUpdate(
      userJWT.id,
      { $set: { last_action_time: Date.now() } },
      { new: true, runValidators: false, upsert: false, setDefaultsOnInsert: false }
    )
  } else {
    return Promise.reject('invalid token')
  }
}

export const middleware: RequestHandler = async function (req, res, next) {
  if (req.headers.authorization) {
    try {
      req.user = await decodeTokenToUser(req.headers.authorization)
      req.context.user = req.user
    } catch (err) {
      return next(err)
    }
  }
  next()
}

interface DecodedJWT {
  id: string
  type?: string
}