// library imports
var mongoose = require('mongoose')

// project imports
const Institution = require('./../../../models/Institution').default

module.exports = function(req, res, next) {
  // the institution_id is a param that will be used to find the institution
  let institutionId = req.params.institution_id

  // we cannot search for an institution if a valid institution_id is not passed in
  if (!mongoose.validateEdjiId(institutionId)) {
    return res.status(403).send()
  }

  Institution.findById(institutionId, {
    name: 1,
    abbreviation: 1,
    outcomes: 1,
  })
    .then(institution => {
      // if instituion is null (meaning it did not exist in the collection)
      if (!institution) {
        return res.status(404).send()
      }

      return res.status(200).send({ institution: institution })
    })
    .catch(err => {
      next(err)
    })
}
