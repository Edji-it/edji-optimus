// library imports
// import { EdjiRequest, EdjiResponse } from '../../../../express.interface'
import { Request, Response, NextFunction } from 'express'

// project imports
import { EmailService } from '../../../../services/email'

export async function SetTokenController(req: Request, res: Response, next: NextFunction) {
  let user = req.user
  let tokenName: string = req.params.token_name

  if (!tokenName) {
    return res.status(400).send({ error: 'no token name provided' })
  }

  let unhashedToken: string = await user.setOneTimeToken(tokenName, 24)
  if (!unhashedToken) {
    // a token is only created if the name is valid
    return res.status(400).send({ error: 'not a valid token property' })
  }

  let varsObj: any = {
    token_url: `https://edji.it/redeem-token/${tokenName}/${unhashedToken}`
  }

  try {
    await EmailService.sendEmail({
      email_template: tokenName,
      name: user.fullname,
      email: user.email,
      from: 'Edji <recovery@edji.it>',
      vars_object: varsObj
    })
  } catch (err) {
    return next(err)
  }

  return res.status(204).send()
}