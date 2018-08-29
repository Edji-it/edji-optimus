// library imports
const joi = require('joi')

// project imports
const emailService = require('./../../../services/email')

module.exports = function(req, res) {
  let email = req.body.email
  let evaluation = req.body.eval
  let attachmentName = req.body.pdfName
  let pdf = req.body.pdf
  let name = req.body.person_receiving
  const subject = 'Reading Report from Edji!'
  let personSharing = req.body.person_sharing
  let personSharingEmail = req.body.person_sharing_email
  let readingName = req.body.reading_name


  /**
   * JOSH THIS IS EXAMPLE JOI VALIDATION
   */
  // const requestSchema = joi.object({
  //   email: joi.string().required(),
  //   pdf: joi.string().required(),
  //   name: joi.string().required(),
  //   personSharing: joi.string().required(),
  //   personSharingEmail: joi.string().required(),
  //   readingName: joi.string().required(),
  // })

  // const body = joi.validate(req.body, requestSchema)
  // if (body.error) {
  //   req.status(400).send({ error: body.error })
  // }
  
  // we cannot add an email address to the pending_invitations if no email is included in the request body
  if (!email || email.length==0) {
    return res.status(400).send({ error: 'cannot send evaluation without a proper email address' })
  }

  // specify the email template to use on the email service
  const emailTemplate = "reading-report"

  let varsObject = {
    "person_sharing": personSharing,
    "evaluation": evaluation,
    "attachment": pdf,
    "attachment_name": attachmentName,
    "attachment_type": 'application/pdf',
    "replyTo": personSharingEmail,
    "reading_name": readingName
  }

  emailService.sendEmail(emailTemplate, subject, name, email, varsObject).then((success) => {
    return res.status(200).send({ success: success })
  })
  .catch((error) => {
    console.error(error)
    return res.status(500).send()
  })
}