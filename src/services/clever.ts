import { get, OptionsWithUrl } from 'request-promise-native'

const cleverUrl = 'https://api.clever.com/v2.0'

export default class Clever {
  private _userId: string
  private _user: CleverTeacher
  private _type: CleverType
  // private _district: CleverDistrictInfo
  private _sections: CleverSections
  private _rpOptions: OptionsWithUrl
  constructor(_token: string) {
    this._rpOptions = {
      url: cleverUrl,
      auth: {
        bearer: _token,
      },
      json: true,
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
      url: [cleverUrl, 'me'].join('/'),
    })
    this._type = meData.type
    this._userId = meData.id
  }

  async getUser(): Promise<CleverTeacher> {
    const { data } = await get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId].join('/'),
    })
    this._user = data
    return this._user
  }

  // async getDistrict(): Promise<CleverDistrictInfo> {
  //   const { data } = await get({
  //     ...this._rpOptions,
  //     url: [cleverUrl, `${this._type}s`, this._userId, 'district'].join('/'),
  //   })
  //   this._district = data
  //   return this._district
  // }

  async getSections(): Promise<CleverSections> {
    const { data } = await get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId, 'sections'].join('/'),
    })
    this._sections = data
    return this._sections
  }

  async getCleverInfo(): Promise<CleverInfo> {
    if (!this._user) {
      await this.getUser()
    }
    const { id, name, email } = this._user
    const fullname = name.first + ' ' + name.last
    // const { name: district_name } = await this.getDistrict()
    let identities = []
    if (this._type === 'student') {
      identities.push('student')
    } else {
      identities.push('teacher')
      if (this._type === 'school_admin' || this._type === 'district_admin') {
        identities.push('administrator')
      }
    }
    const result: CleverInfo = { id, fullname, identities }
    if (email) result.email = email
    return result
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
  name: { first: string; last: string }
  sections: string[]
}

interface CleverDistrictInfo {
  name: string
  id: string
}

interface CleverSections {
  data: {
    grade: string
    id: string
    name: string
    students: string[]
    subject: string
    teacher: string
    teachers: string[]
  }
}
interface CleverInfo {
  fullname: string
  email?: string
  identities: string[]
  // school: { district_name: string }
  id: string
}

interface OAuthObj {
  type: string
  id: string
  singleUseToken: string
  singleUseTokenExpiration: number
  email?: string // students wont have emails
}

type CleverType = 'teacher' | 'student' | 'school_admin' | 'district_admin'
