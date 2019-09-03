// library imports

// project imports
const License = require('./../../../models/License')
const Institution = require('./../../../models/Institution')
const emailService = require('./../../../services/email').EmailService

// REQUIRED: email address and name of the person the user is sharing with for the email body
module.exports = function(req, res, next) {
  let subject = 'Welcome to Edji Academy!'

  let { email, name, role } = req.body

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!email || email.length == 0) {
    return res
      .status(400)
      .send({ error: 'cannot add email address to pending invitations because there was no email in the request' })
  }

  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!name || name.length == 0) {
    return res
      .status(400)
      .send({ error: 'cannot add name to pending invitations because there was no name in the request' })
  }

  // if the role is not defined, we'll default back to 'teacher'
  if (!role || role.length == 0) {
    role = 'teacher'
  }

  // add the email address of the person we're sending a license invitation to that license
  let expiration = new Date(Date.now() + 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 365)
  // used to store the license across steps of the promise, because it will eventually be sent back to the user
  let licenseSend
  License.findById(license_id)
    .exec()
    .then(license => {
      if (!license) {
        return res.status(404).send({ error: 'no license exists for that license_id' })
      }

      // update the expiration date if the invite already exists
      const licenseToUpdate = license.pending_invitations.find(invite => invite.email === email)
      if (licenseToUpdate) {
        licenseToUpdate.expiration = expiration
      } else {
        // if the invitation does not exist, let's add it
        license.pending_invitations.push({
          email,
          name,
          expiration,
          role,
        })
      }

      // save the license and return it for the next step
      return license.edjiSave()
    })
    .then(updatedLicense => {
      // assign this to preserve it across the promise stages
      licenseSend = updatedLicense

      // get the institution info for the email
      return Institution.findById(licenseSend.owning_institution)
    })
    .then(institution => {
      // there's an error on our end if a user's License has a non-existant owning_institution
      if (!institution) {
        return Promise.reject("no institution exists for license's owning_institution")
      }

      // specify the email template to use on the email service
      const emailTemplate = 'license-invite'

      // our email templates are flexible to take in other data to be used in the email body
      // reference the email template documentation on the email service and set the other variables here
      let lastInvitation = licenseSend.pending_invitations.length - 1
      let invitationId = licenseSend.pending_invitations[lastInvitation]._id
      let varsObject = {
        license_url:
          ['https:' + process.env.CLIENT_URL, '#', 'license', 'accept', invitationId].join('/') +
          '?academy=' +
          encodeURIComponent(institution.name),
        institution_name: institution.name,
      }

      // make the request to send the email with the license invitation, then return the license back if all is well
      return emailService.sendEmail({
        email_template: emailTemplate,
        subject,
        name,
        email,
        vars_object: varsObject,
        from: 'Edji <academy@edji.it>',
      })
    })
    .then(() => res.status(200).send({ license: licenseSend }))
    .catch(err => {
      next(err)
    })
}
