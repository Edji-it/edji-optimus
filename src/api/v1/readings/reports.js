// library imports
const joi = require('joi')

// project imports
const emailService = require('./../../../services/email').EmailService
const helpers = require('./_reports')

module.exports = function (req, res, next) {
  const body = helpers.validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  // specify the email template to use on the email service and the subject line for the email
  const subject = 'Reading Report from Edji!'
  const emailTemplate = "reading-report"

  let varsObject = {
    "person_sharing": req.body.person_sharing,
    "evaluation": req.body.evaluation,
    "attachment": req.body.pdf,
    "attachment_name": req.body.attachment_name,
    "attachment_type": 'application/pdf',
    "replyTo": req.body.replyTo,
    "reading_name": req.body.reading_name
  }

  emailService.sendEmail({
    email_template: emailTemplate,
    subject: subject,
    name: req.body.person_receiving,
    email: req.body.email,
    vars_object: varsObject,
    from: "Edji <academy@edji.it>"
  }).then((success) => {
    return res.status(200).send({ success: success })
  })
    .catch((err) => {
      next(err)
    })
}