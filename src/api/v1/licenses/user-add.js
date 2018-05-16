// library imports
const Q = require('q')

// project imports
const License = require('./../../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!license_id) { 
    return res.status(400).send({ error: 'license id is necessary to retrieve information' }) 
  }

  // find the license and remove the pending invitation based on the user's email address
  Q(
    License.findById(license_id).exec() // call for just the json object - not the mongoose wrapped object
  )
  .then((license) => {
    let len_pend = license.pending_invitations.length
    // check through all pending invitations and remove for all that match the user's email address
    for (var i=0; i<len_pend; i++) {
      if (license.pending_invitations[i].email==user.email) {
        // remove the invitation from the license array
        license.pending_invitations.splice(i, 1)
      }
    }
    // save the license now that we've removed all pending invitations for that user's email address
    license.save(false, (err, result) => {
      if (err) {
        return res.status(400).send({ error: err })
      }
    })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })

  // update the user object to add the license_id and set hero_status to true
  user.license_ids.push(license_id)
  user.hero_status = true

  // save the updated user and return it back
  user.save(false, (err, result) => {
    if (err) {
      return res.status(400).send({ error: err })
    } else {
      return res.status(200).send({ user: result })
    }
  })
}