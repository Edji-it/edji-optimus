import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('./constants')
import { iComment } from './../models/Comment'

chai.use(chaiHttp)

export class UserAPI {
  static async login(
    username: string,
    password: string,
    options: {
      returnRoot?: boolean
    } = {},
  ): Promise<LoginObject> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .post('/users/login')
      .send({
        user: {
          username,
          password,
        },
      })
    let returnVal // this typing isn't exactly right...
    if (options.returnRoot) {
      returnVal = res
    } else {
      returnVal = res.body
    }

    return returnVal
  }
  static async create(
    overrideProperties: any = {},
    options: {
      returnCreds?: boolean
    } = {},
  ): Promise<ApiLoginObject> {
    let userProperties: any = {
      username: Date.now().toString(),
      fullname: 'newApiTestUser',
      password: 'codycodycody',
      email: 'auto_' + Date.now().toString() + '@edji.it',
      identities: ['robot', 'business'],
      avatar: '//image-dev.edji.it/avatar/test.png',
      ...overrideProperties,
    }

    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .post('/users')
      .send({
        user: userProperties,
      })
    if (options.returnCreds) {
      res.body.credentials = {
        username: userProperties.username,
        password: userProperties.password,
      }
    }

    return res.body
  }

  static async getReferral(userId: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .get(`/api/v1/users/${userId}/referrals`)
      .set('Authorization', authToken)

    return res.body
  }

  static async getState(key: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .get(`/api/v1/users/@me/state/${key}`)
      .set('Authorization', authToken)

    return res.body
  }
}

export class TempUserAPI {
  static async create(fullname: string): Promise<LoginObject> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .post('/tempusers')
      .send({
        user: {
          fullname,
        },
      })
    return res.body
  }
}

export interface LoginObject {
  token: string
  user: any
}

export class ReadingAPI {
  static async create(authToken: string, overrideProperties: any = {}): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .post('/api/v1/readings')
      .set('Authorization', authToken)
      .send({
        reading: {
          ...data.READINGS.NEW_READING,
          ...overrideProperties,
        },
      })
    return res.body
  }
  static async delete(readingId: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .del(`/readings/${readingId}`)
      .set('Authorization', authToken)

    return res.body
  }
}

export class ProjectAPI {
  static async create(
    overrideProperties: {
      teacher_id?: string
      reading_id?: string
      label?: string
      comments?: iComment[]
      [key: string]: any
    },
    authToken: string,
  ): Promise<any> {
    const project = {
      reading_id: '5adfc5cc7f322d1d7c4405ef',
      label: 'api test project',
      ...overrideProperties,
    }
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .post('/api/v1/projects')
      .set('Authorization', authToken)
      .send(project)

    return res.body
  }
  static async delete(projectId: string, authToken: string): Promise<number> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .del(`/api/v1/projects/${projectId}`)
      .set('Authorization', authToken)
    return res.status
  }
  static async retrieve(projectId: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', authToken)
    return res.body
  }
  static async createComment(projectId: string, body: any, authToken: string, commentType = 'comments'): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .put(`/api/v1/projects/${projectId}/${commentType}`)
      .set('Authorization', authToken)
      .send(body)
    return res.body
  }
  static async update(projectId: string, body: any, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai
      .request(data.SERVER)
      .put(`/api/v1/projects/${projectId}`)
      .set('Authorization', authToken)
      .send(body)
    return res.body
  }
}

interface ApiLoginObject extends LoginObject {
  credentials: {
    username: string
    password: string
  }
}
