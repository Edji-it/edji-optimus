import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('./constants')

chai.use(chaiHttp)

const createUserInfo: () => any = function () {
  return {
    username: Date.now().toString(),
    fullname: "newApiTestUser",
    password: "codycodycody",
    email: 'auto_' + Date.now().toString() + "@edji.it",
    identities: ["robot", "business"],
    avatar: "//image-dev.edji.it/avatar/test.png"
  }
}

export class UserAPI {
  static async login(username: string, password: string): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/users/login')
      .send({
        user: {
          username,
          password
        }
      })
    return res.body
  }
  static async create(): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .post('/users')
      .send({
        user: createUserInfo()
      })
    return res.body
  }
}

export class ReadingAPI {
  static async delete(readingId: string): Promise<any> {
    let res: ChaiHttp.Response = await chai.request(data.SERVER)
      .del(`/readings/${readingId}`)

    return res.body
  }
}