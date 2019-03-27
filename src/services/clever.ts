import { get, OptionsWithUrl } from 'request-promise-native'
import { hash } from 'bcryptjs'

const cleverUrl = 'https://api.clever.com/v2.0'

export default class Clever {
  private _userId: string
  private _user: CleverTeacher
  private _type: CleverType
  private _district: CleverDistrictInfo
  private _sections: CleverSections
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

  async getUser(): Promise<CleverTeacher> {
    const { data } = await get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId].join('/')
    })
    this._user = data
    return this._user
  }

  async getDistrict(): Promise<CleverDistrictInfo> {
    const { data } = await get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId, 'district'].join('/')
    })
    this._district = data
    return this._district
  }

  async getSections(): Promise<CleverSections> {
    const { data } = await get({
      ...this._rpOptions,
      url: [cleverUrl, `${this._type}s`, this._userId, 'sections'].join('/')
    })
    this._sections = data
    return this._sections
  }

  async getEdjiUserShape(): Promise<EdjiUserFromCleverUser> {
    if (!this._user) {
      await this.getUser()
    }
    const { id, name, email } = this._user
    let singleUseToken = await hash(id + Date.now().toString(), 4) // important to use syncronus hashing here
    const cleverObj: OAuthObj = {
      type: 'clever',
      id: id,
      singleUseToken: singleUseToken,
      singleUseTokenExpiration: Date.now() + (1000 * 60) // set token expiration to 1 minute
    }
    const edjiUser: EdjiUserFromCleverUser = {
      fullname: name.first + ' ' + name.last,
      oauth: [cleverObj],
      identities: []
    }
    if (email) {
      edjiUser.email = email
      cleverObj.email = email
    }
    if (this._type === 'student') {
      edjiUser.identities.push('student')
    } else {
      edjiUser.identities.push('teacher')
      if (this._type === 'school_admin' || this._type === 'district_admin') {
        edjiUser.identities.push('administrator')
      }
      const dist = await this.getDistrict()
      // edjiUser.school_name = dist.name
      edjiUser.school_district.district_name = dist.name
    }
    return edjiUser
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
  },
}
interface EdjiUserFromCleverUser {
  fullname: string
  email?: string
  oauth: OAuthObj[]
  identities: string[]
  school_district?: {
    school_name: string
    shool_id: string
    district_name: string
    district_id: string
  }
}

interface OAuthObj {
  type: string
  id: string
  singleUseToken: string
  singleUseTokenExpiration: number
  email?: string // students wont have emails
}

export enum CleverType {
  teacher = 'teacher',
  student = 'student',
  school_admin = 'school_admin',
  district_admin = 'district_admin'
}