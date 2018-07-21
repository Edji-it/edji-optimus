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

  user.setOneTimeToken(tokenName, 24, (token) => {
    let varsObj: any = {
      token_url: `https://edji.it/redeem-tokens/${tokenName}/${token}`
    }

    EmailService.sendEmail(
      'reset-email',
      user.fullname,
      user.email,
      'Edji <recovery@edji.it>',
      varsObj
    )
    .then((response) => {
      return res.status(200).send()
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send({ error: 'error while sending email to user' })
    })
  })
}