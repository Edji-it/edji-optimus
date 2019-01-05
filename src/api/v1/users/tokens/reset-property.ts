import { Request, Response, NextFunction } from 'express'

export function ResetPropertyHandler(): (req: Request, res: Response, next: NextFunction) => void {
  return async (req, res, next) => {
    let reset_property: string = req.params.reset_property
    let resetValue: string = req.body[reset_property]
    let { user } = req

    if (!resetValue || typeof resetValue !== 'string') {
      return res.status(400).send({ error: `${reset_property} required and must be a string` })
    }

    user[reset_property] = resetValue

    try {
      await user.edjiSave(false)
      return res.status(204).send()
    } catch (err) {
      return next(err)
    }
  }
}