const passport = require('passport')
const config = require('config')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Q = require('q')

let User = require("./models/User")

function extractProfile (profile) {
  let imageUrl = ''
  if (profile.photos && profile.photos.length) {
      imageUrl = profile.photos[0].value
  }
  return {
      fullname: profile.displayName,
      email: profile.emails[0].value,
      avatar: imageUrl,
      oauth: [{
          type: profile.provider, // should always be google I think
          id: profile.id
      }]
  }
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `done` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use('google', new GoogleStrategy({
  clientID: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_ID'),
  clientSecret: config.get('AUTH.GOOGLE.OAUTH2_CLIENT_SECRET'),
  callbackURL: config.get('AUTH.GOOGLE.OAUTH2_CALLBACK'),
  accessType: 'offline',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  // Extract the minimal profile information we need from the profile object
  // provided by Google
  let user = User(extractProfile(profile))
  let saveDoc = user.toPublic()
  delete saveDoc._id

  // query for a user that has an oauth type and id matching the auth'd user
  const userQuery = { "oauth.type": user.oauth[0].type, "oauth.id": user.oauth[0].id }
  
  Q(User.findOne(userQuery).exec())
      .then((dbUser) => {
          // if the user doesn't exist, we need to create the user
          if (!dbUser) {
              user.save({
                  forceSave: true
              }, (err, res) => {
                  done(err, res)
              })
          } else {
              // still need to know what to do if the user already exists and is connecting their account
              done(null, dbUser)
          }
      })
      .catch((err) => {
          done(err)
      })
}))

// // read about these: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
// passport.serializeUser((user, done) => {
// // user passed to callback above will be received here 
//   done(null, user._id) // should pass user._id here instead
// })
// passport.deserializeUser((_id, done) => {
// // look the user up in the database by id and return it as second callback of done
// // _id is used as the key to get user's info from session
//   Q(User.findById(_id).exec())
//       .then((user) => {
//           return done(null, user)
//       })
//       .catch((err) => {
//           console.error(err)
//           return done(err)
//       })
// })

module.exports = passport