/**
 * License Model
 */
var ModelCreator = require("./ModelCreator");

// tests email against regex
let emailRe = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let validateEmail = function(email) {
    return emailRe.test(email)
}

// available license types
let licenseTypeEnum = {
  values: ['hero'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

var Model =  ModelCreator("License",{
    license_type: { type: String, required: true, enum: licenseTypeEnum }, // enum of license types, indicates what this license gives access to
    owner: { type: mongoose.Schema.ObjectId }, // mongo id of institution which owns this license
    max_users: { type: Number, required: true, default: 0 }, // number users are intended to have access through this license
    pending_invitations: [{
      email: { type: String, set:toLower, required:true, validate: { validator: validateEmail, message: "Invalid email", kind:"emailRegex" }}, // string, user's email that was invited
      expiration: Date, // date that this invitation will be void
      _id: { type: mongoose.Schema.ObjectId }, // the id of the invitation so that it can be uniquely identified
    }]
});

module.exports = Model;