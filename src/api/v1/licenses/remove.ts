// library imports

// project imports
import License from './../../../models/License'
import User from '../../../models/User'

export default function(req, res, next) {
  const license_id = req.params.license_id,
    email: string = req.body.email
  License.findById(license_id)
    .exec()
    .then(async license => {
      if (!license) {
        return res.status(404).send({ error: 'no license exists for that license_id' })
      }

      // Before we make changes, make sure that the user requesting the removal is actually an owner/admin
      if (license.roles && !license.roles.find(role => String(role.user_id) === String(req.user._id))) {
        return res.status(403).send({ error: "current user isn't allowed to manage users on the license" })
      }

      const user = await User.findOne({ email: email })
      if (user) {
        if (
          !license.pending_invitations.find(x => x.email === email) &&
          !user.license_ids.find(x => String(x.license_id) === String(license._id))
        ) {
          return res.status(404).send({ error: "user doesn't exist on the license" })
        }

        const role = license.roles.find(role => String(role.user_id) === String(user._id))
        if (role && role.role === 'owner') {
          return res.status(403).send({ error: 'removing owner from academy not allowed' })
        }

        license.roles = license.roles.filter(roles => String(roles.user_id) !== String(user._id))
        user.institution_ids = user.institution_ids.filter(
          institution => String(institution) !== String(license.owning_institution),
        )
        user.license_ids = user.license_ids.filter(userLicense => {
          if (String(userLicense.license_id) !== String(license._id)) {
            return userLicense
          }
        }) as [{ license_id: any; joined: Date }]

        // Downgrade user if they aren't subscribed and save user
        user.refresh()
      }

      license.pending_invitations = license.pending_invitations.filter(invite => invite.email !== email)

      // save the license
      return license.edjiSave()
    })
    .then(updatedLicense => res.status(200).send({ license: updatedLicense }))
    .catch(err => {
      next(err)
    })
}
