import * as chai from 'chai'
import chaiHttp = require('chai-http')

import data = require('../../../test/constants')

// prep for http calls
chai.use(chaiHttp)
const outcomeBody = [
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
const request = function (institution_id: string, authToken?: string, requestBody?: any) {
  let url = `/api/v1/institutions/${institution_id}/outcomes`
  let req = chai.request(data.SERVER)
    .post(url)
    .send({ outcomes: requestBody })
  authToken && req.set('Authorization', authToken)
  return req
}

describe('POST api/v1/institutions/:institution_id/outcomes', () => {
  // data used in tests
  const validUserToken: string = data.LOGIN_TOKENS.API_HERO2
  // the following institution_id has outcomes tied to it, do not modify without first verifying
  // the institution you change it with has outcomes in the correct format as the model schema denotes
  const institution_id: string = '5b8c2249120385ed34084b99'
  
  it('should return a 200 with an array of outcomes if successfully adding an outcome', async () => {
    let res = await request(institution_id, validUserToken, outcomeBody)
    res.should.have.status(200)
    res.should.haveOwnProperty('outcomes')

    // check outcomes for valid response properties
    let outcomes = res.body.outcomes
    outcomes.should.be.instanceOf(Array)
    outcomes.length.should.be.above(0)
    outcomes.should.have.property("standard")
    outcomes.should.have.property("short_name")
    outcomes.should.have.property("outcome_statement")
    outcomes.should.have.property("rubric")

    // check rubric for valid response properties
    let rubric = outcomes.rubric[0]
    rubric.should.be.instanceOf(Array)
    rubric.length.should.be.above(0)
    rubric.should.have.property("grade")
    rubric.should.have.property("rubric_statement")
  })

  it('should return a 500 if no new outcomes are passed in to the body', async () => {
    let badReqBody = outcomeBody
    delete badReqBody['standard']
    let res = await request('5b006d759dbfbf137ec0df23', validUserToken, badReqBody)
    res.should.have.status(500)
  })

  it('should return a 500 if outcomes are passed in, but missing a property', async () => {
    let res = await request('5b006d759dbfbf137ec0df23', validUserToken, [])
    res.should.have.status(500)
  })

  it('should return a 404 if passed an incorrect institution_id', async () => {
    let res = await request('5b8c2249120385ed34084b9', validUserToken, outcomeBody)
    res.should.have.status(404)
  })

  it('should return a 401 if no auth token is passed', async () => {
    let res = await request(institution_id, undefined, outcomeBody)
    res.should.have.status(401)
  })
})