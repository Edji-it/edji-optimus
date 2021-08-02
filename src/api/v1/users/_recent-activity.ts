import { ObjectId } from 'mongodb'

export default function recentActivityPipeline(userId: string | ObjectId) {
  return [
    {
      $match: {
        teacher_id: new ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'readings',
        localField: 'reading_id',
        foreignField: '_id',
        as: 'reading',
      },
    },
    {
      $unwind: {
        path: '$reading',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        group: '$label',
        name: '$reading.title',
        date: '$createdAt',
      },
    },
    {
      $project: {
        comments: 1,
        date: 1,
        group: 1,
        name: 1,
      },
    },
    {
      $unwind: {
        path: '$comments',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $gt: [
            {
              $strLenCP: '$comments.data',
            },
            0,
          ],
        },
      },
    },
    {
      $sort: {
        'comments.createdAt': -1,
      },
    },
    {
      $addFields: {
        author: {
          $toObjectId: '$comments.user_id',
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'comments.author',
      },
    },
    {
      $unwind: {
        path: '$comments.author',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unset: [
        'author',
        'comments.start',
        'comments.end',
        'comments.dataArray',
        'comments.replies',
        'comments.updatedAt',
        'comments.user_id',
        'comments.author.prefs',
        'comments.author.media',
        'comments.author.identities',
        'comments.author.reset_email',
        'comments.author.reset_password',
        'comments.author.last_message_check_time',
        'comments.author.last_refresh_time',
        'comments.author.following',
        'comments.author.institution_ids',
        'comments.author.oauth',
        'comments.author.license_ids',
        'comments.author.updatedAt',
        'comments.author.__v',
        'comments.author.last_action_time',
        'comments.author.heard_about_us',
        'comments.author.school',
        'comments.author.password',
        'comments.author.email',
      ],
    },
    {
      $group: {
        _id: '$_id',
        group: {
          $first: '$group',
        },
        name: {
          $first: '$name',
        },
        date: {
          $first: '$date',
        },
        comments: {
          $push: '$comments',
        },
      },
    },
    {
      $project: {
        _id: 1,
        group: 1,
        name: 1,
        date: 1,
        comments: 1,
        numComments: {
          $size: '$comments',
        },
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ]
}
