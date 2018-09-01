// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const License = require('./../../../models/License')
const Institution = require('./../../../models/Institution')
const emailService = require('./../../../services/email')

// REQUIRED: email address and name of the person the user is sharing with for the email body
module.exports = function(req, res) {
  let user = req.user
  let email = req.body.email
  let name = req.body.name
  let role = req.body.role
  let licenseSend

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!license_id) { 
    return res.status(400).send({ error: 'license id is necessary to retrieve information' })
  }

  // we cannot add a license id to the user's object if it is not passed in
  if (!mongoose.Types.ObjectId.isValid(license_id)) { 
    return res.status(403).send() 
  }

  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!email || email.length==0) {
    return res.status(400).send({ error: 'cannot add email address to pending invitations because there was no email in the request' })
  }

  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!name || name.length==0) {
    return res.status(400).send({ error: 'cannot add name to pending invitations because there was no name in the request' })
  }

  // if the role is not defined, we'll default back to 'teacher'
  if (!role || role.length==0) {
    role = 'teacher'
  }

  // add the email address of the person we're sending a license invitation to that license
  let expiration_date = new Date(Date.now() + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 14))
  Q(
    License.findOneAndUpdate(
      {
        _id: license_id,
        "roles.user_id": user._id
      },
      {
        $push: { 
          pending_invitations: {
            'email': email,
            'name': name,
            'expiration': expiration_date,
            'role': role
          }
        }
      },
      {
        new: true
      }
    ).exec()
  )
  .then((updated_license) => {
    // if license is null (meaning it did not exist in the collection)
    if (!updated_license) {
      return Q.reject("license not found")
    }

    // save this object for use in later promise statements
    licenseSend = updated_license

    return Q(Institution.findById(licenseSend.owning_institution).exec())
  })
  .then((institution) => {
    // there's an error on our end if a user's License has a non-existant owning_institution
    if (!institution) {
      return Q.reject("no institution exists for license's owning_institution")
    }

    // specify the email template to use on the email service
    const emailTemplate = "license-invite"

    // our email templates are flexible to take in other data to be used in the email body
    // reference the email template documentation on the email service and set the other variables here
    let lastInvitation = licenseSend.pending_invitations.length-1
    let invitationId = licenseSend.pending_invitations[lastInvitation]._id
    let varsObject = {
      "license_url": ["https:" + process.env.CLIENT_URL, "#", "license", "accept", invitationId].join("/") + '?academy=' + URLEncoder.encode(institution.name, "UTF-8"),
      "institution_name": institution.name
    }

    // make the request to send the email with the license invitation, then return the license back if all is well
    return emailService.sendEmail(emailTemplate, name, email, varsObject)
  })
  .then((success) => {
    return res.status(200).send({ license: licenseSend })
  })
  .catch((error) => {
    console.error(error)
    return res.status(500).send()
  })
}