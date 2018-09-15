// library imports
const emailService = require('../../../services/email')

let createQuery = function ({ username, email }) {
  if (username) {
    return { username }
  } else if (email) {
    return { email }
  } else {
    return
  }
}

let sendRecoveryEmail = function (user) {
  let options = {
    email_template: 'recover-password',
    subject: 'Password Recovery - Edji',
    name: user.fullname,
    email: user.email,
    from: 'recovery@edji.it',
    vars_object: {
      name: user.fullname,
      reset_link: this.createResetLink(user.resetPasswordToken)
    }
  }
  return emailService.sendEmail(options)
}

let createResetLink = function (resetToken) {
  let queryString = 'token=' + encodeURIComponent(resetToken)
  return `http:${process.env.CLIENT_URL}/#/reset-password?${queryString}`
}

module.exports = {
  createQuery,
  sendRecoveryEmail,
  createResetLink
}