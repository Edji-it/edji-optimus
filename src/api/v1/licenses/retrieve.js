// library imports
const Q = require('q')

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  Q(
    License.aggregate([
      { $match: { 
        owning_institution: { $in: user.institution_ids },
        roles: {
          $elemMatch: {
            user_id: user._id,
            "$or": [{
              role: "owner"
            }, {
              role: "administrator"
            }]
          }
        }
      }},
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "license_ids.license_id",
          as: "users"
      }}, 
      { $project: {
        _id: 1,
        max_users: 1,
        pending_invitations: 1,
        roles: 1,
        createdAt: 1,
        updatedAt: 1,
        owning_institution: 1,
        license_type: 1,
        users: {
          _id: 1,
          username: 1,
          fullname: 1,
          email: 1,
          identities: 1,
          last_hero_check: 1,
          hero_status: 1,
          referral_code: 1,
          referred_by: 1,
          license_ids: 1,
          institution_ids: 1,
          stripe_customer_id: 1,
          avatar: 1,
          hero: 1,
          following: 1,
          prefs: 1,
          media: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }}
    ]).exec()
  )
  .then((licenses) => {
    // if licenses are null (meaning it did not exist in the collection)
    if (!licenses || licenses.length < 1) {
      return res.status(404).send()
    }
    return res.status(200).send({ licenses: licenses })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}