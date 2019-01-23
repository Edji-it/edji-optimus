// project imports
const Instituion = require('./../../../models/Institution')

module.exports = async function (req, res, next) {
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

  let results = await institution.edjiSave()
  return res.status(200).send({ institution: institution })
}