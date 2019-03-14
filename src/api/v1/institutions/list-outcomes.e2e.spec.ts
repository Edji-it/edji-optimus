// library imports
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import data = require('../../../test/constants')
import { UserAPI } from './../../../test/methods'
import { User } from '@sentry/node'

// prep for http calls
chai.use(chaiHttp)
const request = function (institution_id: string, authToken: string): Request {
  let url = `/api/v1/institutions/${institution_id}/outcomes`
  let req = chai.request(data.SERVER)
    .get(url)
  authToken && req.set('Authorization', authToken)
  return req
}

let user: User
let token: string
let institution_id: string

describe('GET api/v1/institutions/:institution_id/outcomes', () => {
  before(async () => {
  // data used in tests
    const { username, password } = data.LOGIN_INFO.API_HERO2
    let userRes = await UserAPI.login(username, password)
    token = userRes.token
    user = userRes.user
    institution_id = user.institution_ids[0]
    expect(token).to.exist
    expect(user).to.exist
  })
  
  it('should return a 200 with an array of outcomes if passed an active institution that has outcomes', async () => {
    let res = await request(institution_id, token)
    res.should.have.status(200)
    res.body.should.haveOwnProperty('outcomes')

    // check outcomes for valid response properties
    let outcomes = res.body.outcomes
    outcomes.should.be.instanceOf(Array)
    outcomes.length.should.be.above(0)
    let outcome = outcomes[0]
    outcome.should.have.property("_id")
    outcome.should.have.property("standard")
    outcome.should.have.property("short_name")
    outcome.should.have.property("outcome_statement")
    outcome.should.have.property("rubric")

    // check rubric for valid response properties
    let rubrics = outcome.rubric
    rubrics.should.be.instanceOf(Array)
    rubrics.length.should.be.above(0)
    let rubric = rubrics[0]
    rubric.should.have.property("grade")
    rubric.should.have.property("rubric_statement")
  })

  it('should return a 200 with an empty array an active institution that has no outcomes', async () => {
    let res = await request('5b8897e472aaa60cb2d8ffeb', token)
    res.should.have.status(200)
    res.body.should.haveOwnProperty('outcomes')
    let outcomes = res.body.outcomes
    outcomes.should.be.instanceOf(Array)
    outcomes.length.should.be.equal(0)
  })

  it('should return a 404 if passed an incorrect institution_id', async () => {
    let res = await request('5b8c2249120385ed34084b9', token)
    res.should.have.status(404)
  })

  it('should return a 401 if no auth token is passed', async () => {
    let res = await request(institution_id, undefined)
    res.should.have.status(401)
  })
})