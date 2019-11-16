// project imports
const Instituion = require('./../../../models/Institution').default

module.exports = async function(req, res, next) {
  const new_institution = req.body.institution

  if (!new_institution) {
    return res.status(400).send({ error: 'license properties were never sent' })
  }

  new_institution.license_ids = []

  // create the license from the properties and model and then validate it
  const instance = Instituion(new_institution)
  const error = instance.validateSync()

  // if any of the properties that come in are missing or invalid
  if (error) {
    return res.status(400).send({ error: error.errors })
  }

  try {
    const institution = await instance.edjiSave()
    return res.status(200).send({ institution })
  } catch (err) {
    next(err)
  }
}
