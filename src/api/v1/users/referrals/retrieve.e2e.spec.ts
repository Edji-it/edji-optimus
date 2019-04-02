import * as chai from 'chai'
import chaiHttp = require('chai-http')
import { ObjectId } from 'mongodb'

import data = require('../../../../test/constants')
import { UserAPI, ReadingAPI, LoginObject } from '../../../../test/methods'

const createReferral: (userId: string, authToken?: string) => any = async function(userId, authToken) {
  let req = chai.request(data.SERVER).get(`/api/v1/users/${userId}/referrals`)

  authToken && req.set('Authorization', authToken)
  return req
}

describe('retrieve referrals', () => {
  let newLoginObj: any
  let referral: any

  it("should get a new user's referrals", async function() {
    newLoginObj = await UserAPI.create()
    let { user, token } = newLoginObj
    user.should.not.have.property('referred_by')

    let res = await createReferral(user._id, token)
    res.should.have.status(200)

    // test referral
    referral = res.body
    referral.should.have.property('_id')
    referral.should.have.property('code')
    referral.should.have.property('users_referred')
    referral.users_referred.should.be.instanceOf(Array)
    referral.users_referred.length.should.be.equal(0)
  })
  it("should get an existing user's referrals", async () => {
    let { user, token } = newLoginObj

    let res = await createReferral(user._id, token)
    res.should.have.status(200)

    let resReferral = res.body
    resReferral.should.have.property('_id')
    resReferral._id.should.be.equal(referral._id)
    resReferral.should.have.property('code')
    resReferral.code.should.be.equal(referral.code)
    resReferral.should.have.property('users_referred')
    resReferral.users_referred.should.be.instanceOf(Array)
    resReferral.users_referred.length.should.be.equal(0)
  })
  it('should reject an unauthorized request', async () => {
    let { user } = newLoginObj
    let res = await createReferral(user._id)
    res.should.have.status(401)
  })
  it('should reject a request for referrals that does not correspond with the logged in user id', async () => {
    let fakeId: string = new ObjectId().toString()
    let { token } = newLoginObj
    let res = await createReferral(fakeId, token)
    res.should.have.status(401)
  })
})

describe('referral e2e workflow', () => {
  it('should credit a referral when a referred user creates their first reading', async function() {
    this.timeout(14000)
    let baseUser: LoginObject = await UserAPI.create()
    baseUser.user.should.not.have.property('referred_by')

    // initialize referral
    let { body: ref1 } = await createReferral(baseUser.user._id, baseUser.token)
    ref1.should.have.property('code')
    let referredUser: LoginObject = await UserAPI.create({
      referred_by: ref1.code,
    })
    referredUser.user.should.have.property('referred_by')

    // check that the referredUser was added to the referral object
    let { body: ref2 } = await createReferral(baseUser.user._id, baseUser.token)
    ref2.should.have.property('users_referred')
    ref2.users_referred.should.be.instanceOf(Array)
    ref2.users_referred.length.should.be.equal(1)
    ref2.users_referred[0].should.have.property('user_id')
    ref2.users_referred[0].user_id.should.be.equal(referredUser.user._id)
    ref2.users_referred[0].should.have.property('status')
    ref2.users_referred[0].status.should.be.equal('registered')

    // check that the referredUser's referral was completed
    let { reading } = await ReadingAPI.create(referredUser.token)
    let { body: ref3 } = await createReferral(baseUser.user._id, baseUser.token)
    ref3.should.have.property('users_referred')
    ref3.users_referred.should.be.instanceOf(Array)
    ref3.users_referred.length.should.be.equal(1)
    ref3.users_referred[0].should.have.property('user_id')
    ref3.users_referred[0].user_id.should.be.equal(referredUser.user._id)
    ref3.users_referred[0].should.have.property('status')
    ref3.users_referred[0].status.should.be.equal('completed')
  })
})
