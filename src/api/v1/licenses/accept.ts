// library imports
import { RequestHandler } from 'express'

// project imports
const License = require('./../../../models/License')

const AcceptHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user

    const license =
      req.query.type === 'academy_token'
        ? await getLicenseWithAcademyToken(req.params.invite_id)
        : await getLicenseWithInvitationId(req.params.invite_id, user._id)

    if (!license) return res.status(403).send()

    const matchingLicense = user.license_ids.find(license => license._id.equals(license.license_id))

    // update the user object to add the license_id and set hero_status to true if the license doesn't already exist on their object
    if (!matchingLicense) {
      const new_license = { license_id: license._id, joined: new Date() }
      user.license_ids.push(new_license)
      user.hero_status = true
    }

    // save the updated user and return it back
    user.institution_ids.push(license.owning_institution)
    const updatedUser = await user.edjiSave()
    return res.status(200).send({ user: updatedUser.toPublic() })
  } catch (err) {
    return next(err)
  }
}

const getLicenseWithAcademyToken = (token: string) => {
  return License.findOne({ link_tokens: token }).exec()
}

const getLicenseWithInvitationId = async (invitationId: string, userId: string) => {
  const license = await License.findOne({ 'pending_invitations._id': invitationId }).exec()
  if (!license) return

  // find the invitation for the user so we can collect the information to process the acceptance on the license
  const invititationPos = license.pending_invitations.map(invite => invite._id.toString()).indexOf(invitationId)

  // if the teacher was invited to join the academy as an administrator, let's make sure they are added to the roles object on the license
  // we need to reference the role on the license before we clear the license out
  let licenseRole = license.pending_invitations[invititationPos].role
  if (licenseRole === 'administrator') {
    license.roles.push({
      user_id: userId,
      role: licenseRole,
    })
  }
  // take the invitation out of the license object
  license.pending_invitations.splice(invititationPos, 1)

  return license.edjiSave()
}

export default AcceptHandler
