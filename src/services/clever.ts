import { get, OptionsWithUrl, RequestPromise } from 'request-promise-native'

// let { type, data: meData } = await rp.get({
//   url: 'https://api.clever.com/v2.0/me',
//   ...rpOptions
// })
// // console.log('res', res)
// let { data: profile } = await rp.get({
//   url: `https://api.clever.com/v2.0/${type}s/` + meData.id,
//   ...rpOptions
// })
// console.log('profile', profile)

// const rpOptions = {
//   auth: {
//     bearer: access_token
//   },
//   json: true
// }

const cleverUrl = 'https://api.clever.com/v2.0'

export default class Clever {
  private _userId: string
  private _type: string
  private _rpOptions: OptionsWithUrl
  constructor(_token: string) {
    this._rpOptions = {
      url: cleverUrl,
      auth: {
        bearer: _token
      },
      json: true
    }
  }
  get type() {
    return this._type
  }
  get userId() {
    return this._userId
  }

  async init(): Promise<void> {
    const { data: meData } = await get({
      ...this._rpOptions,
      url: [cleverUrl, 'me'].join('/')
    })
    this._type = meData.type
    this._userId = meData.id
  }

  getUser(): RequestPromise<CleverTeacher> {
    return get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId].join('/')
    })
  }
}

interface CleverMe {
  type: string
  data: {
    id: string
    type: string
  }
}

interface CleverTeacher {
  id: string
  email: string
  name: { first: string, last: string }
  sections: string[]
}