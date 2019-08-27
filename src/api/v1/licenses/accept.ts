// library imports
const mongoose = require('mongoose')

// project imports
import * as License from './../../../models/License'

export default async function(req, res, next) {
  const user = req.user

  // the license_id is a param that will be passed in to add to the user's object
  const userInviteId = req.params.license_id

  const license = await License.findOne({ 'pending_invitations._id': userInviteId })
  // if license is null (meaning it did not exist in the collection)
  if (!license) {
    return res.status(403).send({ error: 'invalid license' })
  }

  // find the invitation for the user so we can collect the information to process the acceptance on the license
  const invititationPos = license.pending_invitations.map(invite => invite._id.toString()).indexOf(userInviteId)

  // if we find the invitation we need to get the role info and then clear the license out
  if (invititationPos > -1) {
    // if the teacher was invited to join the academy as an administrator, let's make sure they are added to the roles object on the license
    // we need to reference the role on the license before we clear the license out
    let licenseRole = license.pending_invitations[invititationPos].role
    if (licenseRole === 'administrator') {
      license.roles.push({
        user_id: user._id,
        role: licenseRole,
      })
    }
    // take the invitation out of the license object
    license.pending_invitations.splice(invititationPos, 1)
  } else {
    // if we could not match up the email for the user in the pending_invitations list
    return res.status(403).send({ error: 'invite not found for email' })
  }

  await license.edjiSave()

  const matchingLicense = user.license_ids.find(license => license._id.equals(license.license_id))

  // update the user object to add the license_id and set hero_status to true if the license doesn't already exist on their object
  if (!matchingLicense) {
    const new_license = {
      license_id: license._id,
      joined: new Date(),
    }
    user.license_ids.push(new_license)
    user.hero_status = true
  }

  // update the user object to add the owning_institution if the owning_institution doesn't already exist on their object
  if (!user.institution_ids.some(id => id.equals(license.owning_institution))) {
    user.institution_ids.push(license.owning_institution)
  }

  // save the updated user and return it back
  const updatedUser = await user.edjiSave()
  return res.status(200).send({ user: updatedUser.toPublic() })
}
