// library imports
import { Request, Response } from '../../../../express.interface'

// project imports
import { EmailService } from '../../../../services/email'

export async function SetTokenController(req: Request, res: Response) {
  let user = req.user
  let tokenName: string = req.params.token_name

  if (!tokenName) {
    return res.status(400).send({ error: 'no token name provided' })
  }

  let unhashedToken: string = await user.setOneTimeToken(tokenName, 24)
  if (!unhashedToken) {
    return res.status(400).send({ error: 'not a valid token property' }) // the error, in this case, is a custom string that I wrote
  }


  let varsObj: any = {
    token_url: `https://edji.it/redeem-tokens/${tokenName}/${unhashedToken}`
  }

  try {
    await EmailService.sendEmail({
      email_template: 'reset-email',
      name: user.fullname,
      email: user.email,
      from: 'Edji <recovery@edji.it>',
      vars_object: varsObj
    })
    return res.status(200).send()
  } catch (err) {
    console.error(err)
    return res.status(500).send({ error: 'error while sending email to user' })
  }
}