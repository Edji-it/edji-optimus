// library imports

// project imports
const License = require('./../../../models/License').default
const Instituion = require('./../../../models/Institution').default
const User = require('../../../models/User').default

module.exports = function(req, res, next) {
  let new_license = req.body.license

  if (!new_license) {
    return res.status(400).send({ error: 'license properties were never sent' })
  }

  // create the license from the properties and model and then validate it
  let license = new License(new_license)
  let error = license.validateSync()

  // if any of the properties that come in are missing or invalid
  if (error) {
    return res.status(400).send({ error: error.errors })
  }

  license
    .edjiSave()
    .then(license => {
      // add the newly created license _id to the institution
      Instituion.findByIdAndUpdate(license.owning_institution, {
        $push: {
          license_ids: license._id,
        },
      })
        .then(institution => {
          return User.findByIdAndUpdate(license.roles[0].user_id, {
            $push: {
              license_ids: {
                license_id: license._id,
                joined: new Date(),
              },
              institution_ids: license.owning_institution,
            },
          })
        })
        .then(user => {
          // send the new license object back after updating the institution to include the new license_id
          return res.status(200).send({ license: license })
        })
    })
    .catch(err => {
      next(err)
    })
}
