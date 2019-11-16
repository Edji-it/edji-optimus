/**
 * Created by bvfergus on 3/5/16.
 */
const express = require('express')
const mongoose = require('mongoose')
const Q = require('q')
const Sentry = require('@sentry/node')

const Reading = require('./../models/Reading').default
const Project = require('./../models/Project').default
const User = require('../models/User').default
const ReadingVersion = require('./../models/ReadingVersion').default
const MountModelToRouter = require('./MountModelToRouter')
const authRequired = require('./../middleware/auth-required')
const Referral = require('./../models/Referral').default

let router = express.Router()

router.get('/versions/:version_id', authRequired, (req, res, next) => {
  let version_id = req.params.version_id
  let user = req.user

  // Validate the reading ID is of the proper type
  if (!mongoose.Types.ObjectId.isValid(version_id)) {
    // If the reading id is not a valid mongo id
    return res.status(400).send()
  }

  let promises = [
    Project.aggregate([
      { $match: { $or: [{ teacher_id: user._id }, { students_ids: user._id }, { temp_ids: user._id }] } },
      {
        $project: {
          teacher_id: 1,
          reading_id: 1,
          label: 1,
          code: 1,
          types: 1,
          createdAt: 1,
          updatedAt: 1,
          comment_count: { $size: { $ifNull: ['$comments', []] } },
          student_count: {
            $sum: [{ $size: { $ifNull: ['$students_ids', []] } }, { $size: { $ifNull: ['$temp_ids', []] } }],
          },
        },
      },
    ]),
    ReadingVersion.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(version_id) } },
      { $unwind: '$readings' },
      {
        $project: {
          _id: '$readings',
        },
      },
      {
        $lookup: {
          from: 'readings',
          localField: '_id',
          foreignField: '_id',
          as: 'reading',
        },
      },
      { $unwind: '$reading' },
      {
        $project: {
          _id: '$reading._id',
          title: '$reading.title',
          owner_id: '$reading.owner_id',
          reading_type: '$reading.reading_type',
          source: '$reading.source',
          cover_img: '$reading.cover_img',
          draft: '$reading.draft',
          createdAt: '$reading.createdAt',
          updatedAt: '$reading.updatedAt',
          versionCount: 1,
          version_count: '$versionCount',
        },
      },
      { $sort: { _id: -1 } },
    ]),
  ]

  Q.all(promises)
    .then(results => {
      var projects = results[0]
      var readings = results[1]

      readings.forEach((reading, index) => {
        readings[index].projects = projects.filter(project => {
          if (project.reading_id && reading._id.equals(project.reading_id)) {
            return true
          } else {
            return false
          }
        })
      })
      if (readings.length < 1) {
        return res.status(404).send()
      }

      // check the first reading's owner_id to see if it matches the user._id
      if (!user._id.equals(readings[0].owner_id)) {
        return res.status(401).send()
      }
      res.status(200).send({ readings })
    })
    .catch(err => {
      next(err)
    })
})

MountModelToRouter(router, Reading, 'reading', { list: false, read: true, delete: false, create: false })

module.exports = router
