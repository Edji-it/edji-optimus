// library imports
import { Request, Response } from '../../../../express.interface'

// project imports
import { EmailService } from '../../../../services/email'

export function SetTokenController(req: Request, res: Response) {
  let user = req.user
  let tokenName: string = req.params.token_name

  if (!tokenName) {
    return res.status(400).send({ error: 'no token name provided' })
  }

  user.setOneTimeToken(tokenName, 24, (err, token) => {
    if (err) {
      return res.status(400).send({ error: err }) // the error, in this case, is a custom string that I wrote
    } else {
      let varsObj: any = {
        token_url: `https://edji.it/redeem-tokens/${tokenName}/${token}`
      }

      EmailService.sendEmail({
        email_template: 'reset-email',
        name: user.fullname,
        email: user.email,
        from: 'Edji <recovery@edji.it>',
        vars_object: varsObj
      })
        .then((response) => {
          return res.status(200).send()
        })
        .catch((err) => {
          console.error(err)
          return res.status(500).send({ error: 'error while sending email to user' })
        })
    }
  })
}