// Library Imports
import * as mongoose from 'mongoose'
import { Schema } from 'mongoose'

// Project Imports
const ModelCreator = require('./ModelCreator').default

// The Main Schema
const Standard = ModelCreator('Standard', {
  standard_type: { type: String, required: true },
  grade_level: { type: String },
  identifier: { type: String, required: true },
  description: { type: String, required: true },
})

export default Standard

// Main interface -- anytime we add to the main Schema above, we need to add to the interface here
// TODO: look in to the typegoose package to streamline this
export interface iStandard extends mongoose.Document {
  identifier: string
  description: string
  standard_type: string
  grade_level: string
}
