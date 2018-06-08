// library imports
const rp = require("request-promise")

const sendEmail = function(email_template, name, email, vars_object) {
  const options = {
    method: 'POST',
    uri: [process.env.EDJI_BLUESTREAK_DOMAIN_LOCAL, "api", "v1", "emails", "sendmail", email_template].join("/"),
    headers: { Authorization: process.env.EDJI_BLUESTREAK_TOKEN },
    body: {
      "from": "brennen@edji.it",
      "subject": "Welcome to Edji Academy!",
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