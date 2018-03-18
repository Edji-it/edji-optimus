// helpers having to do with the database

/**
 * Adds pagination steps to an existing aggregation pipeline (should always be done last, and should not be used when results could exceed 100mb)
 * @param {Array} pipeline The aggregation array which should be paginated
 * @param {number} skip The index of results at which the results should begin returning
 * @param {number} limit The maximum number of readings to return
 */
const paginateAggregation = function(pipeline, skip, limit) {
  return pipeline.concat([
    { $sort: { updatedAt: -1 }},
    { $group: {
      _id: null,
      total: { $sum: 1 },
      results: { $push: "$$ROOT" }
    }},
    { $project: {
      total: true,
      results: { $slice: ["$results", skip, limit] }
    }}
  ])
}

module.exports = {
  paginateAggregation: paginateAggregation
}