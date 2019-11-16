// library imports

// project imports
const License = require('./../../../models/License').default

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
        let: { license_id: '$_id' },
        pipeline: [
          { $unwind: '$license_ids' },
          {
            $match: {
              $expr: { $eq: ['$$license_id', '$license_ids.license_id'] },
            },
          },
          {
            $project: {
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
              following: 1,
              prefs: 1,
              media: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: 'users',
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
