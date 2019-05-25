// library imports
import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')
import { Request } from 'superagent'
import { stringify } from 'querystring'

// project imports
import * as data from './../../../test/constants'
import { UserAPI } from '../../../test/methods'

// prep for http calls
chai.use(chaiHttp)

describe('user state api', () => {
  let newUserToken: string
  let teacherToken: string
  before(async () => {
    const { token } = await UserAPI.create()
    newUserToken = token
  })
  before(async () => {
    let { username, password } = data.LOGIN_INFO.API_TEACHER
    let { token } = await UserAPI.login(username, password)
    teacherToken = token
  })
  const multiUseKey = 'global'
  describe('GET /api/v1/users/@me/state/:key', () => {
    const request = function(key: string, authToken?: string): Request {
      let req = chai.request(data.SERVER).get(`/api/v1/users/@me/state/${key}`)

      authToken && req.set('Authorization', authToken)

      return req
    }
    it('should get a previously created state', async () => {
      const res = await request('test_state', teacherToken)
      expect(res).to.have.status(200)
      expect(res.body).to.deep.equal({
        disclaimer: "please don't change this or you'll break tests",
        obj: {
          arr: [1, 2, 3],
        },
      })
    })
    it('should return an empty object for a key which does not exist', async () => {
      const res = await request(Date.now().toString(), teacherToken)
      expect(res).to.have.status(200)
      expect(res.body).to.deep.equal({})
    })
    it('should reject an unauthorized request', async () => {
      const res = await request('global')
      expect(res).to.have.status(401)
    })
  })
  describe('GET /api/v1/users/@me/state', () => {
    const request = function(query: any, authToken?: string): Request {
      let req = chai.request(data.SERVER).get(`/api/v1/users/@me/state?${stringify(query)}`)

      authToken && req.set('Authorization', authToken)

      return req
    }
    it('should return all of the states combined into a single object', async () => {
      const res = await request({ keys: ['test_state', 'test_state_2'] }, teacherToken)
      expect(res).to.have.status(200)
      expect(res.body).to.deep.equal({
        test_state: {
          disclaimer: "please don't change this or you'll break tests",
          obj: {
            arr: [1, 2, 3],
          },
        },
        test_state_2: {
          disclaimer: 'this is another test state',
        },
      })
    })
    it('should reject a request without the keys parameter', async () => {
      const res = await request({}, newUserToken)
      expect(res).to.have.status(400)
    })
    it('should reject an unauthorized request', async () => {
      const res = await request({ keys: ['key1'] })
      expect(res).to.have.status(401)
    })
  })
  describe('POST /api/v1/users/@me/state/:key', () => {
    const request = function(body: any, key: string, authToken?: string): Request {
      let req = chai
        .request(data.SERVER)
        .post(`/api/v1/users/@me/state/${key}`)
        .send(body)

      authToken && req.set('Authorization', authToken)

      return req
    }
    it('should add to a users state with a new key', async () => {
      const body = {
        some_val: Date.now(),
      }
      const initialState = await UserAPI.getState(multiUseKey, newUserToken)
      expect(initialState).to.deep.equal({})
      const res = await request(body, multiUseKey, newUserToken)
      expect(res).to.have.status(201)
      const afterState = await UserAPI.getState(multiUseKey, newUserToken)
      expect(afterState).to.deep.equal(body)
    })
    it('should overwrite a state', async () => {
      const body = {
        new_val: 'this is updated',
      }
      const res = await request(body, multiUseKey, newUserToken)
      expect(res).to.have.status(201)
      const afterState = await UserAPI.getState(multiUseKey, newUserToken)
      expect(afterState).to.deep.equal(body)
    })
    it('should allow nested objects or arrays to be stored', async () => {
      const body = {
        obj_1: {
          arr_1: [
            {
              val: Date.now(),
            },
          ],
        },
      }
      const key = Date.now().toString()
      const res = await request(body, key, newUserToken)
      expect(res).to.have.status(201)
      const retrievedState = await UserAPI.getState(key, newUserToken)
      expect(retrievedState).to.deep.equal(body)
    })
    it('should reject an unauthorized request', async () => {
      const res = await request({}, 'global')
      expect(res).to.have.status(401)
    })
  })
})
