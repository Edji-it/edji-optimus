// library imports
const mongoose = require('mongoose')
import { hashSync } from 'bcryptjs'
import { pick } from 'underscore'
import { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'

// project imports
// const ModelCreator = require('./ModelCreator').default
import ModelCreator, { EdjiDocument, EdjiModel } from './ModelCreator'
import { bad } from './badwords'

import {
  getUserHeroStatus,
  isValidTokenProperty,
  validateToken,
  createOneTimeTokenObject,
  refreshRequired,
  messageCheckRequired,
  generateOAuthObject,
} from './_User'

// tests email against regex
const emailRe = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
const validateEmail = function(email) {
  return email && emailRe.test(email)
}

const validateName = function(name) {
  return !bad.find(word => {
    return name.indexOf(word) > -1
  })
}

function toLower(str) {
  return str.toLowerCase()
}

const noWhitespaceRe = /^\S*$/ // a string consisting only of non-whitespaces
function noWhitespace(username) {
  return noWhitespaceRe.test(username)
}

let usernameValidator = [
  { validator: validateName, message: 'Invalid username', kind: 'badWords' },
  { validator: noWhitespace, message: 'Invalid username', kind: 'whitespace' },
]

let oauthEnum = {
  values: ['google', 'clever'],
  message: 'oauth type invalid',
}

const OneTimeTokenObject = mongoose.Schema({
  token: { type: String, required: true },
  expiration: { type: Date, required: true, default: Date.now() + 1000 /* s */ * 3600 /* h */ * 24 },
})

const OAuthObject = mongoose.Schema({
  type: { type: String, enum: oauthEnum },
  id: String,
  email: String,
  singleUseToken: String,
  singleUseTokenExpiration: Date,
})

const schema = {
  username: { type: String, set: toLower, unique: true, sparse: true, validate: usernameValidator },
  fullname: {
    type: String,
    validate: { validator: validateName, message: 'Invalid name', kind: 'badWords' },
  },
  initials: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  password: { type: String },
  oauth: [OAuthObject],
  pending_oauth: OAuthObject, // this stores the last user's oauth info who attempted to create an account via oauth, but got a duplicate email error
  // email is pretty much required, except in the case of a student logging in through Clever, so email validation is done manually
  email: {
    type: String,
    set: toLower,
    unique: true,
    validate: { validator: validateEmail, message: 'Invalid email', kind: 'emailRegex' },
  },
  identities: [String],
  school: {
    school_name: String,
    school_id: String, // these are not ObjectIds, but these are Ids from the NCES data collection
    district_name: String,
    district_id: String, // these are not ObjectIds, but these are Ids from the NCES data collection
  },
  sales_can_contact: Boolean,
  phone_number: String,
  referral_code: { type: String, unique: true }, // refers code in Referrals collection
  referred_by: { type: String },
  heard_about_us: {
    source: { type: String },
    detail: { type: String },
  },
  reset_email: { type: OneTimeTokenObject, default: null },
  reset_password: { type: OneTimeTokenObject, default: null },
  archive_readings_before: { type: Date },
  last_action_time: Date, // the time the user last hit the server with an Authorization token
  last_message_check_time: { type: Date, default: Date.now() },
  last_refresh_time: { type: Date, default: Date.now() },
  message_list_id: { type: mongoose.Schema.ObjectId, ref: 'MessageList' },
  hero_status: Boolean, // whether or not we concluded the user was a hero at the last check
  stripe_customer_id: String, // the user's stripe customer id
  license_ids: [
    {
      license_id: { type: mongoose.Schema.ObjectId, ref: 'License', required: true },
      joined: { type: Date, required: true },
    },
  ], // the license id for the user's school's license
  avatar: String,
  following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  prefs: {
    recentEmoji: [String],
    onboarding: {
      highlighting: {
        firstDone: Date,
        lastDone: Date,
      },
      newReading: {
        firstDone: Date,
        lastDone: Date,
      },
      createReadingFromDash: {
        firstDone: Date,
        lastDone: Date,
      },
      firstReadingCreated: {
        firstDone: Date,
      },
    },
  },
  media: {
    images: [
      {
        title: String,
        url: String,
      },
    ],
    documents: [
      {
        uuid: String,
        title: String,
        pages: [String],
        converted: Boolean,
        pdfConverted: Boolean,
        error: Object,
        updatedTime: Date,
        requestedTime: Date,
        pdf: {
          pages: [String],
          location: String,
        },
        disable_words: Boolean,
      },
    ],
  },
  institution_ids: [{ type: mongoose.Schema.ObjectId, ref: 'Institution' }], // array of institution ids which the user is associated with; assumes they are already a teacher if they're being added to an institution
}

/**
 * should figure out how to not override this type and instead pass some model-extending parameter into the ModelCreator
 */
const UserModel = <UserModel>ModelCreator('User', schema, function(schema: Schema<UserDocument>) {
  // function(schema: Schema<UserDocument>) {
  schema.statics.findAndGenerateOAuthLogin = function({ type, id, singleUseToken, singleUseTokenExpiration }) {
    return this.findOneAndUpdate(
      {
        'oauth.id': id,
        'oauth.type': type,
      },
      {
        $set: {
          'oauth.$.singleUseToken': singleUseToken,
          'oauth.$.singleUseTokenExpiration': singleUseTokenExpiration,
        },
      },
      {
        new: true,
        runValidators: true,
        upsert: false,
      },
    ).exec()
  }

  schema.statics.setPendingOAuth = function({ email, oauthObj: pending_oauth }) {
    return this.updateOne(
      { email },
      {
        $set: {
          pending_oauth,
        },
      },
    ).exec()
  }

  // add custom method which returns only the properties which we want to be viewable by the client
  schema.methods.toPublic = function() {
    // list out the properties it is ok to return to the front-end
    const clientProperties = [
      '_id',
      'username',
      'fullname',
      'firstname',
      'lastname',
      'initials',
      'email',
      'identities',
      'last_hero_check',
      'hero_status',
      'referral_code',
      'referred_by',
      'heard_about_us',
      'license_ids',
      'institution_ids',
      'stripe_customer_id',
      'avatar',
      'following',
      'prefs',
      'media',
      'createdAt',
      'updatedAt',
      'school',
      'phone_number',
      'sales_can_contact',
      'archive_readings_before',
      'oauth',
    ]

    // return all of the properties in the above array
    return pick(this, (value, key, object) => {
      return clientProperties.indexOf(key) > -1
    })
  }

  schema.methods.preEdjiSave = async function() {
    if (!this._id) {
      return
    } // get out of here object without an id (at one point, this was returning the entire node process)
    if (this.password && this.isModified('password')) {
      this.password = hashSync(this.password, 10) // set the new password to a hash of itself
    }
    /**
     * since school_name is @deprecated 4/4/2019
     * set the school child property district_name to the value being passed in so we return the correct data to the front end
     */
    if (this.school_name) {
      this.school.district_name = this.school_name
      delete this.school_name
    }
  }

  // add custom validator to make sure user has either oauth type or username/password
  schema.pre('validate', function() {
    const doc = <UserDocument>this
    // make sure it has a password or an oauth type
    let hasPassword = !!doc.password
    let hasEmail = !!doc.email
    let hasOauth = !!(doc.oauth && doc.oauth.length > 0)
    let isValid = (hasPassword && hasEmail) || hasOauth

    // ensure that institution_ids are unique
    if (doc.institution_ids && doc.institution_ids.length) {
      let recordedIds: string[] = []
      doc.institution_ids = doc.institution_ids.filter(id => {
        if (recordedIds.includes(id.toString())) return
        recordedIds.push(id.toString())
        return id
      })
    }

    if (!isValid) {
      // this is a mongoose method which provides the error to the mongoose error aggrigator
      doc.invalidate('auth', 'User must be initalized with credentials (oauth or username/password)', null, 'auth')
    }
  })

  /**
   * clean emails before validating
   */
  schema.pre('validate', function() {
    const doc = <UserDocument>this
    if (!doc.email) {
      /**
       * clever requires us to be more flexible than other systems so we do by allowing users without emails to still sign up
       * this will be the case with students signing in through Clever Library
       */
      const cleverObj = doc.oauth && doc.oauth.length > 0 && doc.oauth.find(obj => obj.type === 'clever')
      if (cleverObj) {
        if (cleverObj.email) doc.email = cleverObj.email
      } else {
        doc.invalidate('email', 'Invalid email', doc.email, 'required')
        return
      }
    }
    if (doc.email) doc.email = doc.email.replace(/ /g, '')
  })

  /**
   * 100% sure that wrapping promises in promises is weird, but I haven't found out how to get the Model#edjiSave() function to return a promise, so this is what I'm doing for now...
   */
  schema.methods.refresh = async function() {
    let validHero = await getUserHeroStatus(this)
    this.hero_status = validHero
    this.last_refresh_time = Date.now()

    return this.edjiSave()
  }

  /**
   * Generates and assigns a one time use token based on provided property
   * @param {string} propertyName the property to assign as a one time use token
   * @param {number} expiration the number of hours that the expiration should last
   * @returns {string} that was set on the user
   */
  schema.methods.setOneTimeToken = async function(propertyName, expiration) {
    if (!isValidTokenProperty(propertyName)) {
      return
    }

    const { unhashedToken, tokenObj } = createOneTimeTokenObject(expiration)
    this[propertyName] = tokenObj
    return unhashedToken
  }

  /**
   * Validates and a token stored on the User based on provided property name
   * @param {string} propertyName property name on user object which contains the token to be used
   */
  schema.methods.validateOneTimeToken = async function(propertyName, unhashedToken) {
    if (!isValidTokenProperty(propertyName) || !this[propertyName]) {
      throw new Error('ERR_INVALID_PROPERTY')
    }

    let isValidToken = validateToken(unhashedToken, this[propertyName])

    if (!isValidToken) {
      throw new Error('ERR_INVALID_TOKEN')
    }
  }

  // allow refreshRequired to be accessed like a property on a User object (like user.refreshRequired)
  schema.virtual('refresh_required').get(function() {
    if (this.isSelected('last_refresh_time')) {
      return refreshRequired(this.last_refresh_time)
    } else {
      return false
    }
  })

  schema.virtual('message_check_required').get(function() {
    if (this.isSelected('last_message_check_time')) {
      return messageCheckRequired(this.last_message_check_time)
    } else {
      return false
    }
  })
})

export default UserModel

export function fromOAuthUser(
  { email, fullname, avatar, id, identities }: OAuthProfile,
  type: OAuthType,
): { user: UserDocument; oauthObj: OAuthObject } {
  if (!identities) identities = []
  const oauthObj = generateOAuthObject(id, type)
  const props: iUser = { fullname, avatar, oauth: [oauthObj], identities }
  if (email) props.email = email
  return { user: new UserModel(props), oauthObj }
}

export interface iUser {
  fullname: string
  email?: string
  password?: string
  avatar?: string
  identities?: string[]
  oauth?: OAuthObject[]
  pending_oauth?: OAuthObject
  message_list_id?: ObjectId
  referred_by?: string
  institution_ids?: ObjectId[]
  school?: {
    school_name?: string
    school_id?: string
    district_name?: string
    district_id?: string
  }
  type?: string
}

export interface UserDocument extends EdjiDocument, iUser {
  toPublic: () => Partial<iUser>
  refresh: () => Promise<UserDocument>
  setOneTimeToken: (property: string, expiration: number) => Promise<string>
  validateOneTimeToken: (property: string, token: string) => void
  preEdjiSave: () => Promise<void>
}

interface UserModel extends EdjiModel<UserDocument> {
  findAndGenerateOAuthLogin: (obj: OAuthObject) => Promise<UserDocument>
  setPendingOAuth: ({ email: string, oauthObj: OAuthObject }) => Promise<any>
}

export interface OAuthObject {
  id: string | number
  type: OAuthType
  email?: string
  singleUseToken: string
  singleUseTokenExpiration: number
}

export type OAuthType = 'google' | 'clever'

interface OAuthProfile extends Partial<iUser> {
  id: string
}
