import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const institutionBody = {
  "abbreviation": "WS",
  "name": "William Stewart IV Academy",
  "license_ids": [
    "5b8c29c40ca7b2ef83ffe845",
    "5b8c2cbf74eaa2f0e5cd66b4",
    "5b8c2ce0b064def11229ad27"
  ],
  "outcomes": [
    {
      "standard": "5c3bc4ebb7e315268ee4d73f",
      "short_name": "Understanding of Cultural Diversity",
      "outcome_statement": "Recount stories, including fables, folktales, and myths from diverse cultures; determine the central message, lesson, or moral and explain how it is conveyed through key details in the text.",
      "rubric": [
        {
          "grade": 0,
          "rubric_statement": "Did not follow instructions. Please try again."
        },
        {
          "grade": 1,
          "rubric_statement": "Solid understanding of cultural diversity. Great job!"
        }
      ]
    }
  ]
}
const short_name_test = new Date().getTime().toString()
const request = function (institution_id: string, authToken?: string, requestBody?: any) {
  let url = `/api/v1/institutions/${institution_id}`
  let req = chai.request(data.SERVER)
    .put(url)
    .send({ institution: requestBody })
  authToken && req.set('Authorization', authToken)
  return req
}

describe('PUT api/v1/institutions/:institution_id', () => {
  // data used in tests
  const validUserToken: string = data.LOGIN_TOKENS.API_HERO2
  // the following institution_id has outcomes tied to it, do not modify without first verifying
  // the institution you change it with has outcomes in the correct format as the model schema denotes
  const institution_id: string = '5b8c2249120385ed34084b99'
  
  it('should return a 200 with an updated institution', async () => {
    let institution_update = institutionBody
    // update the short_name property of the first outcome to the value above so we can verify it changed
    institution_update.outcomes[0].short_name = short_name_test
    let res = await request(institution_id, validUserToken, institution_update)
    res.should.have.status(200)
    res.body.should.haveOwnProperty('institution')

    // check outcomes for valid response properties
    let institution = res.body.institution
    institution.should.have.property("abbreviation")
    institution.should.have.property("name")
    institution.should.have.property("license_ids")

    // check license_ids
    let license_ids = institution.license_ids
    license_ids.should.be.instanceOf(Array)
    license_ids.length.should.be.above(0)

    // check outcomes
    let outcomes = institution.outcomes
    outcomes.should.be.instanceOf(Array)
    outcomes.length.should.be.above(0)
    let outcome = outcomes[0]
    outcome.should.have.property("standard")
    outcome.should.have.property("short_name")
    outcome.short_name.should.equal(short_name_test)
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

  it('should return a 404 if passed an incorrect institution_id', async () => {
    let res = await request('5b8c2249120385ed34084b9', validUserToken, institutionBody)
    res.should.have.status(404)
  })

  it('should return a 401 if no auth token is passed', async () => {
    let res = await request(institution_id, undefined, institutionBody)
    res.should.have.status(401)
  })
})