// library imports
const Q = require('q')

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!license_id) { 
    return res.status(400).send({ error: 'license id is necessary to retrieve information' }) 
  }

  // update the user object to add the license_id and set hero_status to true
  user.license_ids.push(license_id)
  user.hero_status = true

  // save the updated user and return it back
  user.save(false, (err, user) => {
    if (err) {
      return res.status(500).send({ error: err })
    } else {
      // find the license and remove the pending invitation based on the user's email address
      Q(
        License.findByIdAndUpdate( license_id,
          { $pull: {
              pending_invitations: { email: user.email }
            } 
          }
        ).exec()
      )
      .then((license) => {
        return res.status(200).send({ user: user })
      })
      .catch((err) => {
        console.error(err)
        return res.status(500).send()
      })
    }
  })
}