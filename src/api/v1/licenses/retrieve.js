// library imports

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res, next) {
  let user = req.user

  License.aggregate([
    {
      $match: {
        owning_institution: { $in: user.institution_ids },
        roles: {
          $elemMatch: {
            user_id: user._id,
            $or: [
              {
                role: 'owner',
              },
              {
                role: 'administrator',
              },
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'institutions',
        localField: 'owning_institution',
        foreignField: '_id',
        as: 'owning_institution',
      },
    },
    { $unwind: '$owning_institution' },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'license_ids.license_id',
        as: 'users',
      },
    },
    {
      $addFields: {
        'users._id': 1,
        'users.username': 1,
        'users.fullname': 1,
        'users.email': 1,
        'users.identities': 1,
        'users.last_hero_check': 1,
        'users.hero_status': 1,
        'users.referral_code': 1,
        'users.referred_by': 1,
        'users.license_ids': 1,
        'users.institution_ids': 1,
        'users.stripe_customer_id': 1,
        'users.avatar': 1,
        'users.following': 1,
        'users.prefs': 1,
        'users.media': 1,
        'users.createdAt': 1,
        'users.updatedAt': 1,
      },
    },
  ])
    .then(licenses => {
      return res.status(200).send({ licenses })
    })
    .catch(err => {
      next(err)
    })
}
