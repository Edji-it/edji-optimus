// library imports
import { RequestHandler } from 'express'
import { pick } from 'underscore'

// Project imports
import Module from '../../../models/Module'
import { ObjectId } from 'bson'

export const UpdateModuleController: RequestHandler = async (req, res, next) => {
  try {
    const { module_id } = req.params
    const user = req.user
    let updateData: any = req.body

    const updateObject: any = pick(updateData, SIMPLY_UPDATABLE_PROPERTIES)
    const attemptedUpdateProperties: string[] = Object.keys(updateObject)
    if (attemptedUpdateProperties.length === 0) {
      return res.status(400).send({ error: 'no valid update properties in module body' })
    }

    const { n: matchedCount } = await Module.updateOne(
      {
        _id: module_id,
        $or: [{ teacher_id: user._id }, { co_owner_ids: user._id }],
      },
      { $set: updateObject },
      { runValidators: true },
    )

    if (matchedCount < 1) {
      return res.status(404).send({ error: 'no module at that id' })
    }
    return res.status(200).send(updateObject)
  } catch (err) {
    return next(err)
  }
}

export const UpdatePropertyController: RequestHandler = async (req, res, next) => {
  try {
    const { module_id, update_property } = req.params
    const user: lightUser = req.user
    const update: any = req.body

    if (!update) {
      return res.status(400).send({ error: 'no updatable fields found on request body' })
    }

    if (!CUSTOM_UPDATABLE_PROPERTIES.includes(update_property)) {
      return res.status(400).send({ error: 'requested update of a property which could not be updated' })
    }

    const updateObj = await UPDATE_CONTROLLERS[update_property]({ module_id, user, update })
    return res.status(200).send(updateObj)
  } catch (err) {
    if (err.message === 'err_no_module') {
      return res.status(404).send({ error: 'no module found for that id' })
    } else if (err.message === 'err_not_authorized') {
      return res.status(403).send()
    } else if (err.status) {
      return res.status(err.status).send({ error: err.message })
    }
    return next(err)
  }
}

const UPDATE_CONTROLLERS: {
  [key: string]: (props: { module_id: string; user: lightUser; update: any }) => Promise<any>
} = {
  /*
    update structure to add user to group:
      {
        "group_id": ObjectId,
        "user_id": ObjectId
      }
  */
  groups: async function({ module_id, user, update }) {
    const studentsArray: string = user.type && user.type === 'temp' ? 'temp_ids' : 'student_ids'

    // Only allow teacher || co_owners to create groups
    const module = await Module.findOne({
      _id: module_id,
      $or: [{ teacher_id: user._id }, { co_owner_ids: { $in: [user._id] } }],
    })
    if (!module) throw new Error('err_no_module')

    const group = module.groups.find(x => String(x._id) === String(update.group_id))
    if (!group) throw new Error('err_group_not_found')

    if (!update.user_id) throw new Error('err_user_not_found')

    group[studentsArray].push(new ObjectId(update.user_id))

    await module.validate()
    await module.save()
    return module
  },
}

const CUSTOM_UPDATABLE_PROPERTIES = Object.keys(UPDATE_CONTROLLERS)

const SIMPLY_UPDATABLE_PROPERTIES = ['tags', 'co_owner_ids', 'label']

export interface lightUser {
  _id: ObjectId
  fullname: string
  type?: string
}
