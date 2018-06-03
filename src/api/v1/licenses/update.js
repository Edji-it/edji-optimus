// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  let license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!mongoose.Types.ObjectId.isValid(license_id)) { 
    return res.status(403).send() 
  }

  // find the license and remove the pending invitation based on the user's email address
  Q(
    License.findById(license_id).exec()
  )
  .then((license) => {
    // if license is null (meaning it did not exist in the collection)
    if (!license) {
      return res.status(403).send()
    }

    // check through all pending invitations and remove for all that match the user's email address
    let found_email = false
    let len_pend = license.pending_invitations.length
    for (var i=0; i<len_pend; i++) {
      if (license.pending_invitations[i].email==user.email) {
        found_email = true
        // remove the invitation from the license array
        license.pending_invitations.splice(i, 1)
        break
      }
    }

    // if we could not match up the email for the user in the pending_invitations list
    if (!found_email) {
      // if we could not find the email in the list, there's no point in saving the license, and we should not add the license to the user object
      return res.status(403).send({ error: 'could not find an invitation for this email address' }) 
    }

    // save the license now that we've removed all pending invitations for that user's email address
    license.save(false, (err, result) => {
      // update the user object to add the license_id and set hero_status to true if the license doesn't already exist on their object
      if (user.license_ids.indexOf(license_id)==-1) {
        user.license_ids.push(license_id)
        user.hero_status = true
      } 

      // save the updated user and return it back
      user.save(false, (err, user) => {
        if (err) {
          console.error(err)
          return res.status(500).send()
        } else {
          // send the updated user object back if the user is successfully updated
          return res.status(200).send({ user: user.toPublic() })
        }
      })
    })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}