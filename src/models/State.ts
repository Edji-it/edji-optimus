// library imports
import { Schema } from 'mongoose'

// project imports
const ModelCreator = require('./ModelCreator')

export const UserState = ModelCreator(
  'UserState',
  {
    link: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    key: { type: String, required: true, default: 'global' },
    value: { type: Map },
  },
  schema => {
    schema.index({ link: 1, key: 1 }, { unique: true })
  },
)

export const setState = async () => {}
