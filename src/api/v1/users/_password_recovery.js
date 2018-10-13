// library imports
const emailService = require('../../../services/email').EmailService

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
    from: 'Account Recovery <recovery@edji.it>',
    vars_object: {
      name: user.fullname,
      reset_link: this.createResetLink(user.resetPasswordToken)
    }
  }
  return emailService.sendEmail(options)
    .then((response) => {
      return user
    })
}

let createResetLink = function (resetToken) {
  let queryString = 'token=' + encodeURIComponent(resetToken)
  return `http:${process.env.CLIENT_URL}/#/reset-password?${queryString}`
}

let userCanResetPass = function (user) {
  let canReset = false
  if (user.username && user.password) {
    canReset = true
  }
  return canReset
}

module.exports = {
  createQuery,
  sendRecoveryEmail,
  createResetLink,
  userCanResetPass
}