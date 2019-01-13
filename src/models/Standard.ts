// Library Imports
import * as mongoose from 'mongoose'
import { Schema } from 'mongoose'

// Project Imports

// The Main Schema
export const StandardSchema = new Schema({
  identifier: { type: String, required: true },
  description: { type: String, required: true }
},{
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

const Standard = mongoose.model<Standard>('Standard', StandardSchema)
export default Standard

// Main interface -- anytime we add to the main Schema above, we need to add to the interface here
// TODO: look in to the typegoose package to streamline this
export interface Standard extends mongoose.Document {
  identifier: string
  description: string
}