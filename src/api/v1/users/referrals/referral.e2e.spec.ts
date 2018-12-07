import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../../test/constants')
import { UserAPI, ReadingAPI, LoginObject } from '../../../../test/methods'

const createReferral: (userId: string, authToken: string) => any = async function (userId, authToken) {
  return chai.request(data.SERVER)
    .get(`/api/v1/users/${userId}/referrals`)
    .set('Authorization', authToken)
  // return body
}

describe('retrieve referrals', () => {

  it('should get a new user\'s referrals', async function () {
    let { user, token }: LoginObject = await UserAPI.create()
    user.should.not.have.property('referred_by')

    let res = await createReferral(user._id, token)
    // let res = await chai.request(data.SERVER)
    //   .get(`/api/v1/users/${user._id}/referrals`)
    //   .set('Authorization', token)
    res.should.have.status(200)

    let referral = res.body

    // initialize referral
    // let { referral } = await createReferral(user._id, token)
    referral.should.have.property('_id')
    referral.should.have.property('code')
    referral.should.have.property('users_referred')
    referral.users_referred.should.be.instanceOf(Array)
    referral.users_referred.length.should.be.equal(0)
    // let referredUser: LoginObject = await UserAPI.create({
    //   referred_by: referral.code
    // })
    // referredUser.user.should.have.property('referred_by')

    // // check that the referredUser was added to the referral object
    // let { referral: ref2 } = await createReferrals(baseUser.user._id, baseUser.token)
    // ref2.should.have.property('users_referred')
    // ref2.users_referred.should.be.instanceOf(Array)
    // ref2.users_referred.length.should.be.equal(1)
    // ref2.users_referred[0].should.have.property('user_id')
    // ref2.users_referred[0].user_id.should.be.equal(referredUser.user._id)
    // ref2.users_referred[0].should.have.property('status')
    // ref2.users_referred[0].status.should.be.equal('registered')

    // // check that the referredUser's referral was completed
    // let { reading } = await ReadingAPI.create(referredUser.token)
    // let { referral: ref3 } = await createReferrals(baseUser.user._id, baseUser.token)
    // ref3.should.have.property('users_referred')
    // ref2.users_referred.should.be.instanceOf(Array)
    // ref2.users_referred.length.should.be.equal(1)
    // ref2.users_referred[0].should.have.property('user_id')
    // ref2.users_referred[0].user_id.should.be.equal(referredUser.user._id)
    // ref2.users_referred[0].should.have.property('status')
    // ref2.users_referred[0].status.should.be.equal('completed')
  })
})

// describe('referral e2e workflow', () => {

//   it('should credit a referral when a referred user creates their first reading', async function () {
//     this.timeout(14000)
//     let baseUser: LoginObject = await UserAPI.create()
//     baseUser.user.should.not.have.property('referred_by')

//     // initialize referral
//     let { referral: ref1 } = await createReferral(baseUser.user._id, baseUser.token)
//     // let referredUser: LoginObject = await UserAPI.create({
//     //   referred_by: ref1.code
//     // })
//     // referredUser.user.should.have.property('referred_by')

//     // // check that the referredUser was added to the referral object
//     // let { referral: ref2 } = await createReferrals(baseUser.user._id, baseUser.token)
//     // ref2.should.have.property('users_referred')
//     // ref2.users_referred.should.be.instanceOf(Array)
//     // ref2.users_referred.length.should.be.equal(1)
//     // ref2.users_referred[0].should.have.property('user_id')
//     // ref2.users_referred[0].user_id.should.be.equal(referredUser.user._id)
//     // ref2.users_referred[0].should.have.property('status')
//     // ref2.users_referred[0].status.should.be.equal('registered')

//     // // check that the referredUser's referral was completed
//     // let { reading } = await ReadingAPI.create(referredUser.token)
//     // let { referral: ref3 } = await createReferrals(baseUser.user._id, baseUser.token)
//     // ref3.should.have.property('users_referred')
//     // ref2.users_referred.should.be.instanceOf(Array)
//     // ref2.users_referred.length.should.be.equal(1)
//     // ref2.users_referred[0].should.have.property('user_id')
//     // ref2.users_referred[0].user_id.should.be.equal(referredUser.user._id)
//     // ref2.users_referred[0].should.have.property('status')
//     // ref2.users_referred[0].status.should.be.equal('completed')
//   })
// })