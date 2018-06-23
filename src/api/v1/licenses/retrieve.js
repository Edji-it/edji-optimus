// library imports
const Q = require('q')

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  Q(
    License.find( {
        owning_institution: {
          $in: user._id
        },
        roles: {
          $elemMatch: {
            user_id: user._id, 
            role: 'owner'
          }
        }
      }
    ).exec()
  )
  .then((licenses) => {
    // if licenses are null (meaning it did not exist in the collection)
    if (!licenses || licenses.length < 1) {
      return res.status(404).send()
    }
    return res.status(200).send({ licenses: licenses })
  })
  .catch((error)=> {
    console.error(error)
    return res.status(500).send()
  })
}