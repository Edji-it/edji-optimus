import { Request, Response, NextFunction } from 'express'

export async function ResetEmailHandler(req: Request, res: Response, next: NextFunction) {
  let { newEmail } = req.body
  let { user } = req

  console.log('in ResetEmailHandler')

  if (!newEmail || typeof newEmail !== 'string') {
    return res.status(400).send({ error: 'newEmail required and must be a string' })
  }
  console.log('before try')

  user.email = newEmail
  console.log('set email')

  /** ASYNC/AWAIT */
  try {
    console.log('awaiting...')
    await user.edjiSave(false)
    // await user.edjiSave({
    //   update: {
    //     $set: {
    //       email: newEmail
    //     }
    //   }
    // })
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }

  // user.findOneAndUpdate()

  /** CALLBACK */
  // user.edjiSave({ update: { $set: { email: 'not_allowed' } } }, (err, res) => {
  //   if (err) {
  //     return next(err)
  //   }
  //   return res.status(204).send()
  // })

  /** PROMISE */
  // user.edjiSave(false)
  // .then(() => {
  //   console.log('in try')
  //   return res.status(204).send()
  // })
  // .catch((err) => {
  //   return next(err)
  // })
}