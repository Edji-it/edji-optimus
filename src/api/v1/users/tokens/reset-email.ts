import { Request, Response, NextFunction } from 'express'

export async function ResetEmailHandler(req: Request, res: Response, next: NextFunction) {
  let { newEmail } = req.body
  let { user } = req

  if (!newEmail || typeof newEmail !== 'string') {
    return res.status(400).send({ error: 'newEmail required and must be a string' })
  }

  user.email = newEmail

  try {
    await user.edjiSave(false)
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}