// library imports

// project imports
const emailService = require('./../../../services/email')

module.exports = function(req, res) {
  let email = req.body.email
  let evaluation = req.body.eval
  let attachmentName = req.body.pdfName
  let pdf = req.body.pdf
  let name = ''
  let subject = 'Reading Report from Edji!'
  let personSharing = req.body.person_sharing
  
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
    "attachment_type": 'application/pdf'
  }

  return emailService.sendEmail(emailTemplate, subject, name, email, varsObject)
}