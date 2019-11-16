/**
 * License Model
 */
const ModelCreator = require('./ModelCreator').default
const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

// tests email against regex
const emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const validateEmail = function(email) {
  return emailRe.test(email)
}

// converts full string to all lowercase
function toLower(str) {
  return str.toLowerCase()
}

// available license types
const licenseTypeEnum = {
  values: ['hero'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`',
}

// available roles for the user
const licenseRoleEnum = {
  values: ['administrator', 'owner', 'teacher'],
  message: 'institution role invalid',
}

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    set: toLower,
    required: true,
    validate: { validator: validateEmail, message: 'Invalid email', kind: 'emailRegex' },
  }, // string, user's email that was invited
  name: { type: String, required: true },
  expiration: Date, // date that this invitation will be void
  role: { type: String, enum: licenseRoleEnum }, // the role for that particular license
})

const LicenseModel = ModelCreator('License', {
  license_type: { type: String, required: true, enum: licenseTypeEnum }, // enum of license types, indicates what this license gives access to
  owning_institution: { type: mongoose.Schema.ObjectId, required: true, ref: 'Institution' },
  max_users: { type: Number, required: true, default: 0 }, // number users are intended to have access through this license
  pending_invitations: [invitationSchema],
  link_tokens: { type: [String], default: [new ObjectId().toHexString()] },
  roles: [
    {
      user_id: { type: mongoose.Schema.ObjectId, required: true },
      role: { type: String, enum: licenseRoleEnum }, // the role for that particular license
    },
  ],
})

export default LicenseModel
