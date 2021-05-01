import { Request, Response, NextFunction } from 'express'
import User from '../../../../models/User'

// all of the error handling
export async function ResetPropertyHandler(req: Request, res: Response, next: NextFunction) {
  let reset_property: string = req.params.reset_property
  let resetValue: string = req.body[reset_property]
  let { user } = req

  if(reset_property === "email" || reset_property === "username") {
    // We don't want to steal someone's email (or username)
    let users = await User.countDocuments(reset_property === "email" ? {email: resetValue} : {username: resetValue}).exec()
    if(users > 0)
      return res.status(400).send({error: "email or username already exists"})
  }

  try {
    user[`reset_${reset_property}`] = null
    user[reset_property] = resetValue
    await user.edjiSave()
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }

}
