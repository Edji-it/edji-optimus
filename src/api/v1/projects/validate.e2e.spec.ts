// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

import data = require('../../../test/constants')
import { not } from 'joi';

// prep for http calls
chai.use(chaiHttp)

const request = function (code: string): Request {
  let req = chai.request(data.SERVER)
    .get(`/api/v1/projects/${code}/validate`)

  return req
}

describe('GET /api/v1/projects/:project_code/validate', () => {
  it('should indicate that it found a project for a code that exists', async () => {
    const res = await request('35jz')
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('found')
    expect(res.body.found).to.be.equal(true)
    expect(res.body).to.haveOwnProperty('_id')
  })
  it('should indicate that it did not find a project for a code which (probably) does not exist', async () => {
    const res = await request('unique_' + Date.now())
    expect(res).to.have.status(200)
    expect(res.body).to.haveOwnProperty('found')
    expect(res.body.found).to.be.equal(false)
    expect(res.body).not.to.haveOwnProperty('_id')
  })
})