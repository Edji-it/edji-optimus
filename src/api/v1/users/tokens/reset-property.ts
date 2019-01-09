import { Request, Response, NextFunction } from 'express'

// all of the error handling 
export async function ResetPropertyHandler(req: Request, res: Response, next: NextFunction) {
  let reset_property: string = req.params.reset_property
  let resetValue: string = req.body[reset_property]
  let { user } = req

  try {
    user[`reset_${reset_property}`] = null
    user[reset_property] = resetValue
    await user.edjiSave(false)
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}