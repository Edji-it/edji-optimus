/**
 * Feedback Model
 * - Attached to Project objects
 */
import { Document, Types } from 'mongoose'
const ModelCreator = require('./ModelCreator')

const Model = ModelCreator("Feedback", {
  owner_id: { type: Types.ObjectId },
  outcome_id: { type: Types.ObjectId },
  feedback_to: { type: Types.ObjectId, ref: "Comment" },
  evaluation: { type: String, required: true },
})

export default Model

export interface iStandard extends Document {
  identifier: string
  description: string
  standard_type: string
  grade_level: string
}