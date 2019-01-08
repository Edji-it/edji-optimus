import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('./constants')

chai.use(chaiHttp)

export class UserAPI {
  static async login(
    username: string,
    password: string,
    options: {
      returnRoot?: boolean
    } = {}
  ): Promise<LoginObject> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/users/login')
      .send({
        user: {
          username,
          password
        }
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
    } = {}
  ): Promise<ApiLoginObject> {
    let userProperties: any = {
      username: Date.now().toString(),
      fullname: "newApiTestUser",
      password: "codycodycody",
      email: 'auto_' + Date.now().toString() + "@edji.it",
      identities: ["robot", "business"],
      avatar: "//image-dev.edji.it/avatar/test.png",
      ...overrideProperties
    }

    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/users')
      .send({
        user: userProperties
      })
    if (options.returnCreds) {
      res.body.credentials = {
        username: userProperties.username,
        password: userProperties.password
      }
    }

    return res.body
  }

  static async getReferral(userId: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .get(`/api/v1/users/${userId}/referrals`)
      .set('Authorization', authToken)

    return res.body
  }
}

export interface LoginObject {
  token: string
  user: any
}

export class ReadingAPI {
  static async create(authToken: string, overrideProperties: any = {}): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/api/v1/readings')
      .set('Authorization', authToken)
      .send({
        reading: {
          ...data.READINGS.NEW_READING,
          ...overrideProperties
        }
      })
    return res.body
  }
  static async delete(readingId: string, authToken: string): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .del(`/readings/${readingId}`)
      .set('Authorization', authToken)

    return res.body
  }
}

export class ProjectAPI {
  static async create(
    project: {
      reading_id: string,
      label: string
    },
    authToken: string
  ): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/projects')
      .set('Authorization', authToken)
      .send({ project })

    return res.body
  }
}

interface ApiLoginObject extends LoginObject {
  credentials: {
    username: string
    password: string
  }
}