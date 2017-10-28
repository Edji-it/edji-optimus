const passport = require('passport')
const config = require('config')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Q = require('q')
const bcrypt = require('bcryptjs')

let User = require("./models/User")

function extractProfile (profile) {
    let imageUrl = ''
    let singleUseToken = bcrypt.hashSync(profile.id, 4) // important to use syncronus hashing here
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value
    }
    return {
        fullname: profile.displayName,
        email: profile.emails[0].value,
        avatar: imageUrl,
        oauth: [{
            type: profile.provider, // should always be google I think
            id: profile.id,
            singleUseToken: singleUseToken,
            singleUseTokenExpiration: Date.now() + (1000 * 60) // set token expiration to 1 minute
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
    // provided by Google and turn that into a User object
    let user = User(extractProfile(profile))

    // query for a user that has an oauth type and id matching the auth'd user
    const userQuery = { "oauth.type": user.oauth[0].type, "oauth.id": user.oauth[0].id }

    // using the user's id given by oauth, try and look them up and update the single use token and expiration
    User.findOneAndUpdate(
        userQuery,
        {
            $set: {
                'oauth.$.singleUseToken': user.singleUseToken,
                'oauth.$.singleUseTokenExpiration': user.singleUseTokenExpiration
            }
        }, {
            new: true,
            runValidators: true
        }, (err, dbUser) => {
            if (err) {
                console.error(err)
                return done(err)
            }
            else if (!dbUser) {
                // here we know it's a new user, and we need to create them!!
                console.log('no user found with that id!!')
                console.log(user)
                user.save(
                    { forceSave: true },
                    (err, newUser) => {
                        if (err) {
                            console.error(err)
                            return done(err)
                        } else {
                            return done(null, newUser)
                        }
                    }
                )
            } else {
                return done(null, dbUser)
            }
        }
    )
  

//   // TODO: still need to know what to do if the user already exists and is connecting their account
//   Q(User.findOne(userQuery).exec())
//       .then((dbUser) => {
//           // if the user doesn't exist, we need to create the user
//           if (!dbUser) {
//               user.save({
//                   forceSave: true
//               }, (err, res) => {
//                   done(err, res)
//               })
//           } else {

//             console.log(dbUser)

//             let singleUseToken = bcrypt.hashSync(profile.id, 4) // important to use syncronus hashing here
//             let singleUseTokenExpiration =  Date.now() + (1000 * 60)

//             User.findOneAndUpdate(
//                 userQuery,
//                 {
//                     $set: {
//                         'oauth.$.singleUseToken': singleUseToken,
//                         'oauth.$.singleUseTokenExpiration': singleUseTokenExpiration
//                     }
//                 },
//                 {
//                     new: true,
//                     runValidators: true
//                 },
//                 (err, doc) => {
//                     console.log('got the update back!')
//                     if (err) {
//                         console.error(err)
//                         done(err)
//                     } else {
//                         console.log('updatedUser', doc)
//                         done(null, doc)
//                     }
//                 }
//             )

//             // dbUser.save({
//             //     query: {
//             //         _id: user._id,
//             //         'oauth.type': 'google'
//             //     }
//             //     // update: {
//             //     //     $set: {
//             //     //         'oauth.$.singleUseToken': singleUseToken,
//             //     //         'oauth.$.singleUseTokenExpiration': singleUseTokenExpiration
//             //     //     }
//             //     // }
//             // }, (err, doc) => {
//             //     if (err) { done(err) }
//             //     else { done(null, doc) }
//             // })
//           }
//       })
//       .catch((err) => {
//           done(err)
//       })
}))

module.exports = passport