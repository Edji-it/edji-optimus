// library imports
const bcrypt = require('bcryptjs')

// project imports
const User = require('../../../models/User')
const emailService = require('../../../services/email')

// constants
const SUCCESS_STATUS = 204
const PASSWORD_HASH_EXPIRES = /* hours */ 1 * /* seconds */ 3600 * /* ms */ 1000

module.exports = function(req, res) {
    let username = req.body.username

    if (!username) {
        return req.status(400).send({ error: 'no username sent with request' })
    }

    // search for either the user's username or their email - let's be flexible here!
    User.findOne({
        $or: [
            { username },
            { email: username }
        ]
    })
    .then((user) => {
        if (!user) {
        // we don't want them to be able to locate users just with a random username or email
        return res.status(SUCCESS_STATUS).send()
        }

        const HASH = bcrypt.hashSync(String(user._id) + Date.now().toString(), 8)
        user.resetPasswordToken = HASH
        user.resetPasswordExpires = Date.now() + PASSWORD_HASH_EXPIRES

        // update user with reset variables
        return user.edjiSave(false)
    })
    .then(() => {
        let query = 'token=' + encodeURIComponent(user.resetPasswordToken)

        return emailService.sendEmail({
        email_template: 'recover-password',
        subject: 'Password Recovery - Edji',
        name: user.fullname,
        email: user.email,
        from: 'recovery@edji.it',
            vars_object: {
                name: user.fullname,
                reset_link: `http:${process.env.CLIENT_URL}/#/reset-password?${query}`
            }
        })
    })
    .then((res) => {
        return res.status(200).send()
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).send()
    })
}

// function recover(req, res) {
//   var username = req.body.username

//   if (username && username.length > 0) {

//       Q(User.findOne({"username":username}).exec())
//       .then(function(user) {
//           //send back OK response even if the user is not found
//           if (!user) {
//               var e = new Error("No user found")
//               e.status = 204
//               throw e
//           } else {
//               return new Promise(function(resolve, reject) {
//                   bcrypt.hash(String(user._id) + Date.now().toString(), 8, function(err, hash) {
//                       if (err) {
//                           reject(err)
//                       } else {
//                           user.resetPasswordToken = hash
//                           user.resetPasswordExpires = Date.now() + 3600000
//                           resolve(user)
//                       }
//                   })
//               })
//           }
//       }).then(function(user) {

//           user.edjiSave(false, function(err) {
//               if (err) { throw new Error(err) }
//           })

//           //TODO automatically set prod/test keys
//           var transport = nodemailer.createTransport(mandrillTransport({
//               auth: {
//                   apiKey: process.env.MANDRILL_API_KEY
//               }
//           }))

//           var query = 'token=' + encodeURIComponent(user.resetPasswordToken)
          
//           //TODO set link to Angular component URL
//           transport.sendMail({
//               from: 'Edji <recovery@edji.it>',
//               to: user.email,
//               subject: 'Password Recovery - Edji',
//               html: `
//                   <p>Hello ${user.fullname},</p>
//                   <p>You (or someone else) requested a password reset on your Edji account. Please click the link to <a href="http:${process.env.CLIENT_URL}/#/reset-password?${query}">reset your password</a></p>
//                   <hr>
//                   <p>If you did not request a password reset, please ignore this email.</p>
//                   <br>
//                   <p>Keep reading!</p>
//                   <p>The <strong>Edji</strong> Team</p>
//               `
//           }, function(err, info) {
//               if (err) {
//                   throw new Error(err)
//               } else {
//                   // we don't really care - if there's not an error, everything happened correctly
//               }
//           })
//           return res.status(204).send()
//       }).catch(function(e) {

//           // e.status will be 204 if no user is found so that we don't tell people the user exists
//           var status
//           if (e.status && e.status === 204) {
//               status = e.status
//           } else {
//               console.error(e)
//               status = 500
//           }
//           // var status = e.status || 500
//           res.status(status).send()
//       })
//   }

// }