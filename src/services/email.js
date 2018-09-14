// library imports
const rp = require("request-promise")

const sendEmail = function({ email_template, subject, name, email, from, vars_object }) {
  const options = {
    method: 'POST',
    uri: [process.env.EDJI_BLUESTREAK_DOMAIN, "api", "v1", "emails", "sendmail", email_template].join("/"),
    headers: { Authorization: process.env.EDJI_BLUESTREAK_TOKEN },
    body: {
      "from": from,
      "subject": subject,
      "recipients": [
        {
          "name": name,
          "email": email,
          "vars": vars_object
        }
      ]
    },
    json: true
  }

  // make the request to send the email with the license invitation
  return rp(options)
}

module.exports = {
  sendEmail: sendEmail
}