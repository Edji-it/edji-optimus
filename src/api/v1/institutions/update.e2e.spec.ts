import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')
import { UserAPI } from './../../../test/methods'

// prep for http calls
chai.use(chaiHttp)
const institutionBody = {
	"outcomes": [
		{
			"rubric": [
				{
					"grade": 0,
					"rubric_statement": "Please try again."
				}
      ],
      "_id": "5c51002c09b09e0099d57d74",
			"short_name": "Use Text",
			"outcome_statement": "I can ask and answer questions",
			"standard": "5c3bc4c648bf8f26594db29c"
		}
	]
}

const short_name_test = new Date().toUTCString()
const request = function (institution_id: string, authToken?: string, requestBody?: any) {
  let url = `/api/v1/institutions/${institution_id}`
  let req = chai.request(data.SERVER)
    .put(url)
    .send(requestBody)
  authToken && req.set('Authorization', authToken)
  return req
}

let authToken: string
let institution_id: string

describe('PUT api/v1/institutions/:institution_id', () => {
  // get us a user so we can pass that authToken to the request
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_HERO
    let { token, user } = await UserAPI.login(username, password)
    authToken = token
    institution_id = user.institution_ids[0]
  })

  it('should return a 200 with an updated institution', async () => {
    let institution_update = institutionBody
    // update the short_name property of the first outcome to the value above so we can verify it changed
    institution_update.outcomes[0]['short_name'] = short_name_test
    const res = await request(institution_id, authToken, institution_update)
    res.should.have.status(200)
    res.body.should.haveOwnProperty('institution')

    // check outcomes for valid response properties
    const institution = res.body.institution
    institution.should.have.property("abbreviation")
    institution.should.have.property("name")
    institution.should.have.property("license_ids")

    // check license_ids
    const license_ids = institution.license_ids
    license_ids.should.be.instanceOf(Array)

    // check outcomes
    const outcomes = institution.outcomes
    outcomes.should.be.instanceOf(Array)
    outcomes.length.should.be.above(0)
    const outcome = outcomes[0]
    outcome.should.have.property("standard")
    outcome.should.have.property("short_name")
    outcome.short_name.should.equal(short_name_test)
    outcome.should.have.property("outcome_statement")
    outcome.should.have.property("rubric")

    // check rubric for valid response properties
    const rubrics = outcome.rubric
    rubrics.should.be.instanceOf(Array)
    rubrics.length.should.be.above(0)
    const rubric = rubrics[0]
    rubric.should.have.property("grade")
    rubric.should.have.property("rubric_statement")
  })

  it('should return a 404 if passed an incorrect institution_id', async () => {
    const res = await request('5b8c2249120385ed34084b9', authToken, institutionBody)
    res.should.have.status(404)
  })

  it('should return a 401 if no auth token is passed', async () => {
    const res = await request(institution_id, undefined, institutionBody)
    res.should.have.status(401)
  })
})