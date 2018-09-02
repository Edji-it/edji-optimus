// library imports
const Q = require('q')
var mongoose = require("mongoose")

// project imports
const License = require('./../../../models/License')

module.exports = function(req, res) {
  let user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  const userInviteId = req.params.license_id

  // we cannot add a license id to the user's object if it is not passed in
  if (!mongoose.Types.ObjectId.isValid(userInviteId)) { 
    return res.status(403).send({ error: 'invalid license' }) 
  }
  
  // find the license and remove the pending invitation based on the user's email address
  Q(
    License.findOne({
      "pending_invitations._id": userInviteId
    }).exec()
  )
  .then((license) => {
    // if license is null (meaning it did not exist in the collection)
    if (!license) {
      return res.status(403).send({ error: 'invalid license' })
    }

    let license_id=license._id

    let user_role = ''
    // find the invitation for the user
    let invititationPos = license.pending_invitations.map((invite) => { return invite._id.toString() }).indexOf(userInviteId)
    if (invititationPos > -1) {
      if (license.pending_invitations[invititationPos].role && license.pending_invitations[invititationPos].role==='administrator') {
        user_role = license.pending_invitations[invititationPos].role
      }
      user_role = license.pending_invitations[invititationPos].role
      // take the invitation out of the license object
      license.pending_invitations.splice(invititationPos, 1)
    } else {
      // if we could not match up the email for the user in the pending_invitations list
      return res.status(403).send({ error: 'invite not found for email' }) 
    }

    // if the teacher was invited to join the academy as an administrator, let's make sure they are added to the roles object on the license
    if (user_role==='administrator') {
      license.roles.push({
        user_id: user._id,
        role: user_role
      })
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
          // make sure the license was added to the user object
          let licensePos = findLicense(user.license_ids, license._id)
          if (licensePos > -1) {
            // send the updated user object back if the user is successfully updated
            return res.status(200).send({ user: user.toPublic() })
          } else {
            return res.status(500).send()
          }
        }
      })
    })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}

/**
 * Checks for the license on the user object since it is an array of objects including licnese_id and joined date
 * @param userLicenses the licenses on the user object, which is an array of licenses
 * @param license_id the license we are looking to confirm is on the user object
 */
function findLicense(userLicenses, license_id) {
  let arrLength = userLicenses.length
  for (var i=0; i<arrLength; i++) {
    if(userLicenses[i].license_id.equals(license_id)) {
      return i
    }
  }
  return -1
}