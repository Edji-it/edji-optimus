// library imports
import { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'

// project imports
import ModelCreator, { EdjiDocument } from './ModelCreator'

export const UserState = ModelCreator<StateDocument>(
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

interface StateDocument extends EdjiDocument {
  link: ObjectId
  key: string
  value: any
}
