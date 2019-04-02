import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const outcomeBody = {
  rubric: [
    {
      grade: 0,
      rubric_statement: 'Please try again.',
    },
  ],
  _id: '5c51002c09b09e0099d57d74',
  outcome_statement: 'I can ask and answer questions',
  standard: '5c3bc4c648bf8f26594db29c',
}
const shortName = {
  short_name: 'Use Text',
}
const institutionBody = {
  name: 'EDJI TEST ACADEMY',
}

const shortNameTest = new Date().toUTCString()
const outcomeRequest = function(propName: string, institution_id: string, authToken: string, requestBody: any) {
  let url = `/api/v1/institutions/${institution_id}/${propName}`
  let req = chai
    .request(data.SERVER)
    .put(url)
    .send(requestBody)
  authToken && req.set('Authorization', authToken)
  return req
}
const institutionRequest = function(institution_id: string, authToken: string, requestBody: any) {
  let url = `/api/v1/institutions/${institution_id}`
  let req = chai
    .request(data.SERVER)
    .put(url)
    .send(requestBody)
  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let institution_id: string

describe('PUT api/v1/institutions/:institution_id/:property_name', () => {
  // get us a user so we can pass that authToken to the request
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token, user } = await UserAPI.login(username, password)
    authToken = token
    institution_id = user.institution_ids[0]
  })

  it('should return a 200 with an updated outcome', async () => {
    let outcomUpdate = {
      short_name: shortNameTest,
      ...outcomeBody,
    }
    const res = await outcomeRequest('outcomes', institution_id, authToken, outcomUpdate)
    res.should.have.status(200)

    // check outcomes
    const outcome = res.body
    outcome.should.have.property('standard')
    outcome.should.have.property('short_name')
    outcome.short_name.should.equal(shortNameTest)
    outcome.should.have.property('outcome_statement')
    outcome.should.have.property('rubric')

    // check rubric for valid response properties
    const rubrics = outcome.rubric
    rubrics.should.be.instanceOf(Array)
    rubrics.length.should.be.above(0)
    const rubric = rubrics[0]
    rubric.should.have.property('grade')
    rubric.should.have.property('rubric_statement')
  })

  it('should return a 406 if no updates are passed in', async () => {
    const res = await outcomeRequest('outcomes', institution_id, authToken, {})
    res.should.have.status(406)
  })

  it('should return a 400 if the update object passed in is not a valid property to update', async () => {
    const res = await outcomeRequest('invalidProp', institution_id, authToken, {})
    res.should.have.status(400)
  })
})

describe('PUT api/v1/institutions/:institution_id', () => {
  // get us a user so we can pass that authToken to the request
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token, user } = await UserAPI.login(username, password)
    authToken = token
    institution_id = user.institution_ids[0]
  })

  it('should return a 200 with an updated institution', async () => {
    let institutionUpdate = {
      name: shortNameTest,
    }
    const res = await institutionRequest(institution_id, authToken, institutionUpdate)
    res.should.have.status(200)

    // check outcomes for valid response properties
    const institution = res.body
    institution.should.have.property('name')
    institution.name.should.equal(shortNameTest)
  })

  it('should return a 400 for an institution to update that is invalid', async () => {
    let institutionUpdate = {
      invalidProp: true,
    }
    const res = await institutionRequest(institution_id, authToken, institutionUpdate)
    res.should.have.status(400)
  })

  it('should return a 400 if passed an incorrect institution_id', async () => {
    const res = await institutionRequest('5b8c2249120385ed34084b9', authToken, institutionBody)
    res.should.have.status(400)
  })

  it('should return a 401 if no auth token is passed', async () => {
    const res = await institutionRequest(institution_id, undefined, institutionBody)
    res.should.have.status(401)
  })
})
