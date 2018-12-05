import { ObjectId } from 'mongodb'
import * as ReadingVersion from './../../../models/ReadingVersion'
import * as Referral from './../../../models/Referral'

// if the original owner is not the user, we need to create a new version_id to keep track of this user's version separately
// this means that, if we don't receive an owner_id with the call, we will attribute this to a new version
//  if it doesn't come with a version_id attached, we assume it's the first version and add a record to the linking table
//  all we have to do is give it the version id, because later we'll create the ReadingVersion based on this id
export async function assignVersionId(reading: any, userId: ObjectId) {
  if (
    !reading.owner_id ||
    !userId.equals(reading.owner_id) ||
    !reading.version_id
  ) {
    reading.version_id = new ObjectId()
    let version = new ReadingVersion({
      _id: reading.version_id,
      owner_id: userId,
      readings: [reading._id]
    })
    await version.save()
  } else {
    await ReadingVersion.findOneAndUpdate(
      {
        _id: reading.version_id,
        owner_id: userId
      },
      {
        $push: { readings: reading.version_id },
        updatedAt: Date.now()
      }, {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    )
  }

  // going to just always set owner_id for now. don't see any reason that the front end would set it
  reading.owner_id = userId
}

export async function recordUserReferral(user: any): Promise<void> {
  if (shouldRedeemReferral(user)) {
    if (!user.prefs) user.prefs = {}
    if (!user.prefs.onboarding) user.prefs.onboarding = {}

    // update and save the user to record that they've made their first reading
    user.prefs.onboarding.firstReadingCreated = { firstDone: Date.now() }
    await user.edjiSave(false)
    // update the corresponding referral so that the referring user gets credit
    await Referral.findOneAndUpdate(
      {
        code: user.referred_by,
        'users_referred.user_id': user._id
      },
      {
        $set: {
          'users_referred.$.status': "completed"
        }
      }
    )
  }
}

function shouldRedeemReferral(user: any): boolean {
  return !!user.referred_by &&
    (
      !user.prefs ||
      !user.prefs.onboarding ||
      !user.prefs.onboarding.firstReadingCreated ||
      !user.prefs.onboarding.firstReadingCreated.firstDone
    )
}