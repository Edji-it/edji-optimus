// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const License = require('./../../../models/License')
const Instituion = require('./../../../models/Institution')
const User = require('./../../../models/User')

module.exports = function(req, res) {
  let new_license = req.body.license

  if (!new_license) {
    return res.status(400).send({ error: "license properties were never sent" })
  }

  // add the pending_invitations array (empty) to the new_license
  new_license.pending_invitations = []

  // create the license from the properties and model and then validate it
  let license = License(new_license)
  let error = license.validateSync()

  // if any of the properties that come in are missing or invalid
  if (error) {
    return res.status(400).send({ error: error.errors })
  }

  license.edjiSave(false, function(err, license) {
    if (err) {
      return res.status(500).send({ error: err })
    }
    // add the newly created license _id to the institution
    Q(
      Instituion.findByIdAndUpdate(
        license.owning_institution,
        {
          $push: { 
            license_ids: license._id
          }
        }
      )
      .exec()
    )
    .then((institution) => {
      Q(
        User.findByIdAndUpdate(
          license.roles[0].user_id,
          {
            $push: {
              license_ids: {
                license_id: license._id,
                joined: new Date()
              },
              institution_ids: license.owning_institution
            }
          }
        )
        .exec()
      )
      .then((user) => {
        // send the new license object back after updating the institution to include the new license_id
        return res.status(200).send({ license: license })
      })
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send()
    })
  })
}