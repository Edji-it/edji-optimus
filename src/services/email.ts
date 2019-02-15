// library imports
import * as rp from 'request-promise-native'

export class EmailService {

  public static sendEmail({ email_template, name, subject, email, from, vars_object }: EmailOptions): rp.RequestPromise {
    const options: rp.OptionsWithUri = {
      uri: [process.env.EDJI_BLUESTREAK_DOMAIN, "api", "v1", "emails", "sendmail", email_template].join("/"),
      headers: { Authorization: process.env.EDJI_BLUESTREAK_TOKEN },
      body: {
        "from": from,
        "subject": subject,
        "recipients": [
          {
            "name": name,
            "email": email,
            "vars": vars_object
          }
        ]
      },
      json: true
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