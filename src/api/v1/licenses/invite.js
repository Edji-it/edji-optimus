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
  let licenseSend = {}

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

  // add the email address of the person we're sending a license invitation to that license
  let expiration_date = new Date(Date.now() + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 14))
  // Q(License.findByIdAndUpdate(
  //   license_id,
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
            'expiration': expiration_date
          }
        }
      },
      {
        new: true
      }
    ).exec()
  )
  .then((updated_license) => {
    licenseSend = updated_license
    console.log(licenseSend)
    // if license is null (meaning it did not exist in the collection)
    if (licenseSend==={} || licenseSend===null) {
      return res.status(403).send() 
    }
    return Q(Institution.findById(updated_license.owning_institution)
      .exec())
    })
    .then((institution) => {
      // if license is null (meaning it did not exist in the collection)
      if (licenseSend==={} || licenseSend===null) {
        return res.status(403).send() 
      }

      // specify the email template to use on the email service
      let email_template = "license-invite"

      // our email templates are flexible to take in other data to be used in the email body
      // reference the email template documentation on the email service and set the other variables here
      let vars_object = {
        "license_url": ["https:" + process.env.CLIENT_URL, "#", "license", "accept", licenseSend._id].join("/"),
        "institution_name": institution.name
      }

      // make the request to send the email with the license invitation, then return the license back if all is well
      return emailService.sendEmail(email_template, name, email, vars_object)
    })
    .then((success) => {
      return res.status(200).send({ license: licenseSend })
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send()
    })
}