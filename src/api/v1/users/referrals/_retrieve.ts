// library imports
import { generate } from 'randomstring'

// project imports
import * as Referral from './../../../../models/Referral'

/**
 * Generates and saves a unique referral code, meant to be called recursively
 * @param {number} callCount The number of times this function has been called in an attempt to generate a unique code
 */
export async function createUniqueReferral(): Promise<any> {
  for (let i = 0; i < 5; i++) {
    const possibleCode = generate({
      readable: true,
      length: 5,
      capitalization: 'lowercase'
    })
    let referral = await Referral.findOne({ code: possibleCode })
    if (!referral) {
      let newReferral = await new Referral({ code: possibleCode }).edjiSave(false)
      return newReferral
    }
  }
  throw new Error('referral code was not able to be generated after 5 attempts')
}