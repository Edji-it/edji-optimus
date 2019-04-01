// project imports
const User = require('./../models/User')
const _bumblebee = require('./../services/bumblebee')

module.exports = function() {
  return User.aggregate([
    {
      $match: {
        'license_ids.license_id': {
          $exists: true,
        },
      },
    },
    {
      $unwind: '$license_ids',
    },
    {
      $lookup: {
        from: 'licenses',
        localField: 'license_ids.license_id',
        foreignField: '_id',
        as: 'license',
      },
    },
    {
      $unwind: '$license',
    },
    {
      $group: {
        _id: '$license._id',
        max_users: {
          $first: '$license.max_users',
        },
        users_count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        over_max: {
          $cmp: ['$users_count', '$max_users'], // returns 1 if users_count is greater than max_users, 0 if equal, -1 if otherwise
        },
        users_count: 1,
      },
    },
    {
      $match: {
        over_max: {
          $gte: 0,
        },
      },
    },
    {
      $lookup: {
        from: 'institutions',
        localField: '_id',
        foreignField: 'license_ids',
        as: 'academy',
      },
    },
    {
      $unwind: '$academy',
    },
  ])
    .exec()
    .then(results => {
      let message = ''

      results.forEach(({ users_count, academy }) => {
        message += `Academy: "${academy.name}" is over their user count of ${users_count}\n`
      })

      return _bumblebee.sendMessage(message)
    })
}
