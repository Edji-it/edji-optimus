// library imports
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// project imports
const User = require('./../models/User')
const { generateLoginObjectForUser, login } = require('./../middleware/login-controller')
const authRequired = require('./../middleware/auth-required')
const cleanMongoValidationError = require('./../error-handlers/mongo-validation').cleanMongoValidationError

const router = express.Router()

/**
 * @deprecated 3/8/19
 */ 
router.post('/', require('./../api/v1/users/create').default)

router.put('/', authRequired, async function(req, res, next) {
  let userData = req.body.user
  let user = req.user

  if (!userData) {
    return res.status(400).send()
  }

  if (userData.referred_by && user.referred_by && user.referred_by != userData.referred_by) {
    return res.status(400).send({ error: "you dumb for tryna update a user's referred_by" })
  }

    const UPDATABLE_PROPERTIES = [
        'fullname',
        'email',
        'prefs',
        'media',
        'avatar',
        'identities',
        'referred_by',
        'school_name',
        'school_district',
        'phone_number',
        'sales_can_contact',
        'archive_readings_before'
    ]

    UPDATABLE_PROPERTIES.forEach((property) => {
        if (userData[property]) {
            /**
             * since school_name is @deprecated 4/4/2019
             * set the school_district child property district_name to the value being passed in so we return the correct data to the front end
             */
            if (userData.school_name) {
                userData.school_district.district_name = userData.school_name
            }
            user[property] = userData[property]
        }
    })

    try {
        let result = await user.edjiSave()
        if (!result)
            return res.status(400).send({ error: 'no result returned from saving user' })
        else
            return res.status(201).json(generateLoginObjectForUser(result))
    } catch (error) {
        // constructs object with list of model-defined errors to send to user
        if (error.name === "ValidationError") {
            let validationErrors = cleanMongoValidationError(error)
            return res.status(406).send({ validationErrors })
        } else if (error.code === 11000) {
            return res.status(409).send()
        } else {
            return next(error)
        }
    }
  }
)

/**
 * Search route for followers
 */
router.get('/following', authRequired, (req, res, next) => {
  let user = req.user

  let allowedTypes = ['popular']

  let type = req.query.type || 'popular'

  if (allowedTypes.indexOf(type) < 0) {
    return res.status(400).send({
      errors: [
        {
          parameter: 'type',
          message: 'type does not match any allowed type values',
          value: type,
        },
      ],
    })
  }

  User.aggregate([
    { $match: { following: { $exists: true } } },
    { $unwind: '$following' },
    { $group: { _id: '$following', len: { $sum: 1 } } },
    { $sort: { len: -1 } },
    { $limit: 5 },
  ])
    .then(users => {
      return res.status(200).send({ users: users })
    })
    .catch(err => {
      next(err)
    })
})

router.get('/:id', authRequired, function(req, res) {
  let user = req.user
  let _id = req.params.id

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send()
  }

  if (!user._id.equals(_id)) {
    return res.status(401).send()
  }

  return res.status(200).send({ user: user.toPublic() })
})

// this route doesn't currently have tests, which is bad... but I don't know how to test oauth
router.get('/', (req, res, next) => {
  const { oauth_type, oauth_token } = req.query
  if (!oauth_type || !oauth_token) {
    return res.status(400).send({ error: 'missing oauth_type or oauth_token from query' })
  }

  User.findOne({
    'oauth.singleUseToken': oauth_token,
    'oauth.singleUseTokenExpiration': { $gte: Date.now() },
    'oauth.type': oauth_type,
  })
    .then(user => {
      if (!user) {
        return res.status(404).send()
      } else {
        return res.status(200).send(generateLoginObjectForUser(user))
      }
    })
    .catch(err => {
      next(err)
    })
})

/**
 * @deprecated 1/24/2019
 */
router.put('/convert/:temp_id', authRequired, require('./../api/v1/temp_users/convert'))

/**
 * @deprecated 3/13/19
 */
router.post('/login', require('./../api/v1/users/login').default)

/**
 * @deprecated 3/27/19
 */
router.post(
  '/reset_password',
  (req, res, next) => {
    const { oldPassword, newPassword } = req.body && req.body.resetObject && req.body.resetObject

    req.body = {
      old_password: oldPassword,
      new_password: newPassword,
    }
    next()
  },
  require('./../api/v1/users/change-pass').default,
)

// finds the asset of the specified type on the user object
//  if it doesn't find anything, it will return undefined
let getAssetOnUser = function(user, type, id) {
  let assetToDelete = user.media[type].find(asset => {
    return asset._id == id
  })
  return assetToDelete
}

let getAssetFileLocations = function(asset, type) {
  switch (type) {
    case 'images':
      return [asset.url]
    case 'documents':
      return asset.pages.slice()
    default:
      return
  }
}

router.delete('/assets/:type/:asset_id', authRequired, async (req, res, next) => {
  let user = req.user
  let assetId = req.params.asset_id
  let type = req.params.type
  const allowedTypes = ['images', 'documents']

  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    return res.status(400).send({ error: 'not a valid id' })
  }

  // kick them out if they try to access a type that isn't allowed
  if (allowedTypes.indexOf(type) < 0) {
    return res.status(400).send({ error: 'type not allowed' })
  }

  let assetToDelete = getAssetOnUser(user, type, assetId)

  // tell the requester if the object doesn't exist on this user
  if (!assetToDelete) {
    return res.status(404).send()
  }

  let fileLocations = getAssetFileLocations(assetToDelete, type)

  // remove the object from the user's media array
  user.media[type].splice(user.media[type].indexOf(assetToDelete), 1)

  try {
    // make sure to save the user without the asset which will be deleted
    await user.edjiSave()
    return res.status(200).send({ file_locations: fileLocations })
  } catch (err) {
    next(err)
  }
})

/**
 * Adds a user id to a user's "following" array
 */
router.put('/following', authRequired, async function(req, res, next) {
  let user = req.user
  let user_id = req.body.user_id
  let follow = req.body.action == 'follow'

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(400).send({ error: 'invalid user_id property' })
  }

  if (user_id == user._id) {
    return res.status(400).send({ error: 'you cannot follow yourself' })
  }

  if (!req.body.action) {
    return res.status(400).send({ error: 'no action specified' })
  }

  if (!user_id) {
    return res.status(400).send({ error: 'no user_id specified' })
  }

  if (!user.following) {
    user.following = []
  }

  let followingMatch = user.following.find(value => {
    return value.equals(user_id)
  })
  if (follow) {
    if (!followingMatch) {
      user.following.push(user_id)
    } else {
      return res.status(400).send({
        error: 'requested user is already followed',
        action: req.body.action,
      })
    }
  } else {
    if (followingMatch) {
      user.following.splice(user.following.indexOf(followingMatch), 1)
    } else {
      return res.status(400).send({
        error: 'requested user was not yet followed',
        action: req.body.action,
      })
    }
  }

  try {
    await user.edjiSave()
    return res.status(200).send({ user: user.toPublic() })
  } catch (err) {
    next(err)
  }
})

module.exports = router
