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
  let subject = 'Welcome to Edji Academy!'

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
  // used to store the license across steps of the promise, because it will eventually be sent back to the user
  let licenseSend
  License.findById(license_id).exec()
  .then((license) => {
    // see if we already have an invitation for this user
    let invititationPos = license.pending_invitations.map(
      (invite) => {
        return invite.email
      }
    )
    .indexOf(email)

    // update the expiration date if the invite already exists
    if (invititationPos > -1) {
      license.pending_invitations[invititationPos].expiration = expiration_date
    } else {
      // if the invitation does not exist, let's add it
      license.pending_invitations.push(
        {
          email: email,
          name: name,
          expiration: expiration_date,
          role: role
        }
      )
    }

    // save the license and return it for the next step
    return license.edjiSave(false)
  })
  .then((updatedLicense) => {
    // if license is null (meaning it did not get updated in the collection)
    if (!updatedLicense) {
      return Q.reject("license not found")
    }

    // assign this to preserve it across the promise stages
    licenseSend = updatedLicense

    // get the institution info for the email
    return Institution.findById(licenseSend.owning_institution)
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
      "license_url": ["https:" + process.env.CLIENT_URL, "#", "license", "accept", invitationId].join("/") + '?academy=' + encodeURIComponent(institution.name),
      "institution_name": institution.name
    }

    // make the request to send the email with the license invitation, then return the license back if all is well
    return emailService.sendEmail(emailTemplate, subject, name, email, varsObject)
  })
  .then((success) => {
    return res.status(200).send({ license: licenseSend })
  })
  .catch((error) => {
    console.error(error)
    return res.status(500).send()
  })
}