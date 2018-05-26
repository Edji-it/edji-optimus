// library imports
const Q = require('q')
let rp = require("request-promise")

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user
  let email = req.body.email

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!license_id) { 
    return res.status(400).send({ error: 'license id is necessary to retrieve information' })
  }

  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!email || email.length==0) {
    return res.status(400).send({ error: 'cannot add email address to pending invitations because there was no email in the request' })
  }

  // add the email address of the person we're sending a license invitation to that license
  let expiration_date = new Date(Date.now() + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 14))
  Q(License.findByIdAndUpdate(
    license_id,
    {
      $push: { 
        pending_invitations: {
          'email': email,
          'expiration': expiration_date
        }
      }
    }, {new: true}
  ).exec()).then((license) => {
    // if license is null (meaning it did not exist in the collection)
    if (!license) {
      return res.status(403).send() 
    }

    // send an email to the user that let's them know they've been invited to join a license and gives them a link to process the invite
    let email_template = "test"
    let options = {
        method: 'POST',
        uri: [process.env.EDJI_BLUESTREAK_DOMAIN_LOCAL, "api", "v1", "emails", "sendmail", email_template].join("/"),
        headers: { Authorization: process.env.EDJI_BLUESTREAK_TOKEN },
        body: {
          "from": "brennen@edji.it",
          "subject": "From AWS & Template",
          "recipients": [
            {
              "name": "Josh",
              "email": "josh@edji.it",
              "vars": {}
            }
          ]
        },
        json: true
    }

    rp(options)
    .then((success) => {
      return res.status(200).send({ license: license })
    })
    .catch((error) => {
      return res.status(500).send({ error: error })
    })    
  })
  .catch((error) => {
    console.error(error)
    res.status(500).send()
  })
}