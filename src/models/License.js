/**
 * License Model
 */
var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")

// tests email against regex
let emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let validateEmail = function(email) {
    return emailRe.test(email)
}

// converts full string to all lowercase
function toLower(str) {
    return str.toLowerCase()
}

// available license types
let licenseTypeEnum = {
  values: ['hero'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

// available roles for the user
let licenseRoleEnum = {
    values: ['administrator', 'owner'],
    message: 'intstitution role invalid'
}

var Model =  ModelCreator("License",{
    license_type: { type: String, required: true, enum: licenseTypeEnum }, // enum of license types, indicates what this license gives access to
    owner: { type: mongoose.Schema.ObjectId, required: true }, // mongo id of institution which owns this license
    max_users: { type: Number, required: true, default: 0 }, // number users are intended to have access through this license
    pending_invitations: [{
      email: { type: String, set:toLower, required:true, validate: { validator: validateEmail, message: "Invalid email", kind:"emailRegex" }}, // string, user's email that was invited
      expiration: Date // date that this invitation will be void
    }],
    roles: [{
        user_id: { type: mongoose.Schema.ObjectId }, 
        role: { type: String, enum: licenseRoleEnum } // the role for that particular license
    }]
})

module.exports = Model