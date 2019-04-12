// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { ObjectId } from 'mongodb'

// project imports
import * as data from './../../../test/constants'
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

const request = function(body: any, authToken?: string): Request {
  let req = chai
    .request(data.SERVER)
    .put(`/users`)
    .send(body)

  authToken && req.set('Authorization', authToken)

  return req
}

const UPDATABLE_PROPERTIES = [
  'fullname',
  'prefs',
  'media',
  'avatar',
  'identities',
  'school_district',
  'phone_number',
  'sales_can_contact',
  'school',
  'archive_readings_before',
]

const identities = ['teacher', 'student', 'robot', 'administrator']

const getUserUpdate = () => {
  const dateTime = new Date()
  return {
    fullname: 'test name' + dateTime.toString(),
    prefs: {
      onboarding: {
        createReadingFromDash: {},
        firstReadingCreated: {},
        highlighting: {
          lastDone: dateTime.toISOString(),
        },
        newReading: {},
      },
      recentEmoji: [dateTime.getTime().toString()],
    },
    media: {
      documents: [
        {
          _id: new ObjectId().toHexString(),
          pages: [
            '//image-dev.edji.it/pdf/9f0f28b9-afef-44d8-ba2d-2d82ba8c6bf7/9f0f28b9-afef-44d8-ba2d-2d82ba8c6bf7-0.jpg',
          ],
          title: 'a test name ' + dateTime.getTime(),
        },
      ],
      images: [
        {
          _id: new ObjectId().toHexString(),
          url: '//image-dev.edji.it/readings/058167e4-b0b8-494a-a9d0-8b1aad3883b7.jpeg',
        },
      ],
    },
    avatar: dateTime.toString(),
    identities: [identities[Math.floor(Math.random() * identities.length)]], // pick a random identity
    referred_by: new ObjectId().toHexString(),
    school_name: dateTime.toString(),
    district_name: dateTime.toString(),
    phone_number: dateTime.toString(),
    sales_can_contact: !!Math.round(Math.random()),
    archive_readings_before: dateTime.toISOString(),
    school: {
      district_name: dateTime.toString(),
    },
  }
}

let authToken: string
let userState: any
let newUserCredentials

describe('PUT /api/v1/users/@me', () => {
  before(async () => {
    const { user, token, credentials } = await UserAPI.create({}, { returnCreds: true })
    authToken = token
    userState = user
    newUserCredentials = credentials
  })

  for (let prop of UPDATABLE_PROPERTIES) {
    it(`should update the ${prop} property on a user object`, async () => {
      const updateProp = getUserUpdate()[prop]
      const body = { user: { [prop]: updateProp } }
      const res = await request(body, authToken)
      expect(res).to.have.status(201)
      expect(res.body).to.haveOwnProperty('user')
      expect(res.body.user[prop]).to.eql(updateProp)
    })
  }
  /**
   * @deprecated 4/4/19
   */
  it('should specially handle a school_name update', async () => {
    const school_name = Date.now().toString()
    const res = await request({ user: { school_name } }, authToken)
    expect(res).to.have.status(201)
    expect(res.body).to.haveOwnProperty('user')
    expect(res.body.user.school).to.eql({ district_name: school_name })
  })
  it('should not update other properties', async () => {
    const res = await request({ user: { password: '12345', email: 'corbin@edji.it' } }, authToken)
    expect(res).to.have.status(201)
    // make sure returned properties don't get updated
    expect(res.body.user.email).to.eql(userState.email)
    const { token: newToken } = await UserAPI.login(newUserCredentials.username, newUserCredentials.password)
    expect(newToken.length).to.be.greaterThan(0) // make sure password didn't get updated
  })
  it('should ignore updates for properties which do not exist', async () => {
    const res = await request({ user: { does_not_exist: true } }, authToken) // should be equivalent to an empty request
    expect(res).to.have.status(201)
  })
  it('should get a 400 if there is no user update in the request', async () => {
    const res = await request({}, authToken)
    expect(res).to.have.status(400)
  })
  it('should get a 400 if trying to update referred_by, if it already exists', async () => {
    const { username, password } = data.LOGIN_INFO.API_HERO2
    const { token } = await UserAPI.login(username, password)
    const res = await request({ user: { referred_by: Date.now() } }, token)
    expect(res).to.have.status(400)
  })
  it('should get a 406 if the request is updating a property with an invalid value', async () => {
    const res = await request({ user: { sales_can_contact: 'this is not a boolean' } }, authToken)
    expect(res).to.have.status(406)
  })
  it('should receive a 401 for an unauthorized request', async () => {
    const res = await request({})
    expect(res).to.have.status(401)
  })
})
