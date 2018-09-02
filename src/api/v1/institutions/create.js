// library imports
const Q = require('q')

// project imports
const Instituion = require('./../../../models/Institution')

module.exports = function(req, res) {
  let new_institution = req.body.institution

  if (!new_institution) {
    return res.status(400).send({ error: "license properties were never sent" })
  }

  new_institution.license_ids = []

  // create the license from the properties and model and then validate it
  let institution = Instituion(new_institution)
  let error = institution.validateSync()

  // if any of the properties that come in are missing or invalid
  if (error) {
    return res.status(400).send({ error: error.errors })
  }

  institution.save(false, function(err, institution) {
    if (err) {
      return res.status(500).send({ error: err })
    }
    // send the new institution object back 
    return res.status(200).send({ institution: institution })
  })
}