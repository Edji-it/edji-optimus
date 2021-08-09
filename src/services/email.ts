// library imports
import * as rp from 'request-promise-native'

export class EmailService {
  public static sendEmail({
    email_template,
    name,
    subject,
    email,
    from,
    vars_object,
  }: EmailOptions): rp.RequestPromise {
    const options: rp.OptionsWithUri = {
      uri: [process.env.EDJI_FLAK_URL, 'email'].join('/'),
      qs: { auth_token: process.env.EDJI_FLAK_TOKEN },
      body: {
        from: from,
        subject: subject,
        recipients: [
          {
            name: name,
            email: email,
            vars: vars_object,
          },
        ],
        template: email_template,
      },
      json: true,
    }

    // make the request to send the email with the license invitation
    return rp.post(options)
  }
}

export interface EmailOptions {
  email_template: string
  name: string
  subject: string
  email: string
  from: string
  vars_object: { [key: string]: string }
}
