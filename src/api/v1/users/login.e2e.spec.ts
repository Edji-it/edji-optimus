// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'

// project imports
import * as data from './../../../test/constants'
import { validateLoginObject } from './create.e2e.spec'

// prep for http calls
chai.use(chaiHttp)

const request = function(body: any): Request {
  let req = chai
    .request(data.SERVER)
    .post(`/api/v1/users/login`)
    .send({ user: body })

  return req
}

describe('POST /api/v1/users/login', () => {
  it('should log in a user with a username and password', async () => {
    const credentials = Object.assign({}, data.LOGIN_INFO.API_HERO)
    const res = await request(credentials)
    expect(res).to.have.status(200)
    validateLoginObject(res.body)
  })
  it('should log in a user with an email and password', async () => {
    const { email: username, password } = Object.assign({}, data.LOGIN_INFO.API_HERO)
    const res = await request({ username, password })
    expect(res).to.have.status(200)
    validateLoginObject(res.body)
  })
  it('should log a user in regardless of capitalization in the username', async () => {
    let credentials = Object.assign({}, data.LOGIN_INFO.API_HERO)
    credentials.username = credentials.username.toUpperCase()
    const res = await request(credentials)
    expect(res).to.have.status(200)
    validateLoginObject(res.body)
  })
  it('should return a 401 for an incorrect password', async () => {
    let credentials = Object.assign({}, data.LOGIN_INFO.API_HERO)
    credentials.password = 'probablynotthepass'
    const res = await request(credentials)
    expect(res).to.have.status(401)
  })
  it('should should be case sensitive for the password', async () => {
    let credentials = Object.assign({}, data.LOGIN_INFO.API_HERO)
    credentials.password = credentials.password.toUpperCase()
    const res = await request(credentials)
    expect(res).to.have.status(401)
  })
  it('should reject a request without a username', async () => {
    let { password } = Object.assign({}, data.LOGIN_INFO.API_HERO)
    const res = await request({ password })
    expect(res).to.have.status(400)
  })
  it('should reject a request without a password', async () => {
    let { username } = Object.assign({}, data.LOGIN_INFO.API_HERO)
    const res = await request({ username })
    expect(res).to.have.status(400)
  })
  it('should reject a request without a user', async () => {
    const res = await request(undefined)
    expect(res).to.have.status(400)
  })
})
