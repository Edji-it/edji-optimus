// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  const license_id = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!mongoose.Types.ObjectId.isValid(license_id)) { 
    return res.status(403).send({ error: 'invalid license' }) 
  }
  
  // find the license and remove the pending invitation based on the user's email address
  Q(
    License.findById(license_id).exec()
  )
  .then((license) => {
    // if license is null (meaning it did not exist in the collection)
    if (!license) {
      return res.status(403).send({ error: 'invalid license' })
    }

    // check through all pending invitations and remove for all that match the user's email address
    let found_email = false
    let len_pend = license.pending_invitations.length
    let user_role = ''
    for (var i=len_pend-1; i>-1; i--) {
      if (license.pending_invitations[i].email==user.email) {
        // check if the user was given admin privileges to add them to the roles array on this license
        if (license.pending_invitations[i].role && license.pending_invitations[i].role==='administrator') {
          user_role = license.pending_invitations[i].role
        }
        found_email = true
        // remove the invitation from the license array (if multiple invitations for this email address, we'll remove)
        license.pending_invitations.splice(i, 1)
      }
    }

    // if the teacher was invited to join the academy as an administrator, let's make sure they are added to the roles object on the license
    if (user_role==='administrator') {
      license.roles.push({
        user_id: user._id,
        role: user_role
      })
    }

    // if we could not match up the email for the user in the pending_invitations list
    if (!found_email) {
      // if we could not find the email in the list, there's no point in saving the license, and we should not add the license to the user object
      return res.status(403).send({ error: 'invite not found for email' }) 
    }

    // save the license now that we've removed all pending invitations for that user's email address
    license.save(false, (err, result) => {
      let matchingLicense = user.license_ids.find((license) => {
        return license.license_id && license.license_id.equals(license_id)
      })

      // update the user object to add the license_id and set hero_status to true if the license doesn't already exist on their object
      if (!matchingLicense) {
        let new_license = {
          license_id: license_id,
          joined: new Date()
        }
        user.license_ids.push(new_license)
        user.hero_status = true
      } 

      // update the user object to add the owning_institution if the owning_institution doesn't already exist on their object
      if (user.institution_ids.indexOf(license.owning_institution)==-1) {
        user.institution_ids.push(license.owning_institution)
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