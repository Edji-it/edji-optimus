import * as chai from 'chai'
import chaiHttp = require('chai-http')
import data = require('./constants')

chai.use(chaiHttp)
const request: ChaiHttp.Agent = chai.request(data.SERVER)

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
    let res: ChaiHttp.Response = await request.post('/users/login')
      .send({
        user: {
          username,
          password
        }
      })
    return res.body
  }
  static async create(): Promise<any> {
    let res: ChaiHttp.Response = await request.post('/users')
      .send({
        user: createUserInfo()
      })
    return res.body
  }
}