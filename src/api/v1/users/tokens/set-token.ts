// library imports
// import { EdjiRequest, EdjiResponse } from '../../../../express.interface'
import { Request, Response, NextFunction } from 'express'
import { AES } from 'crypto-js'

// project imports
import { EmailService } from '../../../../services/email'

export async function SetTokenController(req: Request, res: Response, next: NextFunction) {
  let user = req.user
  let tokenName: string = req.params.token_name

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
      subject: 'Edji support request',
      email: user.email,
      from: 'Edji <support@edji.it>',
      vars_object: varsObj
    })

    // Alright, class. We're gonna do something funky here. In order to end to end test the use-token endpoints, we
    //  need to have access to the unhashed tokens, which we can't get from the fake Amazon SES mailbox we use
    //  during testing. To get around this, we're going to sneakily encrypt the unhashed token, and send it back
    //  to the front end, and call it requestId (so that people hopefully don't think it's something special).
    //  Also, I don't unit test this part because it's used directly in the e2e tests, so it will cause problems
    //  if it is wrong.
    let requestId: string = AES.encrypt(unhashedToken, process.env.OPTIMUS_TOKEN_SIGNING_SECRET).toString()

    return res.status(200).send({ requestId })
  } catch (err) {
    return next(err)
  }
}