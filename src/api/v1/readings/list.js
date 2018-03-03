// library imports
const joi = require('joi')

// project imports
const helpers = require('./_list')
const ReadingVersion = require('./../../../models/ReadingVersion')

module.exports = function(req, res) {
  const user = req.user
  // const queryValues = joi.string().valid([
  //     'projects'
  // ])
  // const querySchema = joi.object({
  //     pop: joi.alternatives().try(
  //         joi.array().items(queryValues),
  //         queryValues
  //     )
  //     .default([])
  // })

  // const query = joi.validate(req.query, querySchema)
  const query = helpers.validateQuery(req.query)
  if (query.error) {
      return res.status(400).send({ error: query.error })
  }

  let dbQuery
  if (query.value.pop.indexOf("projects") > -1) {
      dbQuery = ReadingVersion.aggregate([
          { $match: { owner_id: user._id }},
          { $project: {
              versionCount: { $size: "$readings" },
              readings: 1,
              updatedAt: 1
          }},
          { $unwind: "$readings" },
          { $group: {
              _id: "$_id",
              reading: { $last: "$readings" },
              versionCount: { $last: "$versionCount" },
              updatedAt: { $last: "$updatedAt" },
              promoter_count: { $last: "$promoter_count" }
          }},
          { $sort: { "updatedAt": -1 } },
          { $lookup: {
              from: "readings",
              localField: "reading",
              foreignField: "_id",
              as: "reading"
          }},
          { $unwind: "$reading"},
          { $project: {
              _id: "$reading._id",
              title: "$reading.title",
              owner_id: "$reading.owner_id",
              teacher_ids: "$reading.teacher_ids",
              "public": "$reading.public",
              source: "$reading.source",
              subjects: "$reading.subjects",
              grade_levels: "$reading.grade_levels",
              cover_img: "$reading.cover_img",
              draft: "$reading.draft",
              version_id: "$reading.version_id",
              createdAt: "$reading.createdAt",
              updatedAt: "$reading.updatedAt",
              versionCount: 1
          }}
      ])
  } else {
      dbQuery = Q(Reading.find({
          owner_id: user._id
      })
      .select({
          title: true,
          owner_id: true,
          "public": true,
          source: true,
          subjects: true,
          source: true,
          subjects: true,
          grade_levels: true,
          cover_img: true,
          draft: true,
          version_id: true,
          createdAt: true,
          updatedAt: true,
          versionCount: true
      })
      .sort({ updatedAt: -1 })
      .exec())
  }

  dbQuery.then((readings) => {
      return res.status(200).send(readings)
  })
  .catch((err) => {
      return res.status(500).send()
  })

}