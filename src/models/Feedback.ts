/**
 * Feedback Model
 * - Attached to Project objects
 */
import { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'
import ModelCreator, { EdjiDocument } from './ModelCreator'

const Feedback = ModelCreator('Feedback', {
  owner_id: { type: Schema.Types.ObjectId },
  outcome_id: { type: Schema.Types.ObjectId },
  feedback_to: { type: Schema.Types.ObjectId, ref: 'Comment' },
  evaluation: { type: String, required: true },
})

export default Feedback

export interface iFeedback extends EdjiDocument {
  owner_id: ObjectId
  outcome_id: ObjectId
  feedback_to: ObjectId
  evaluation: string
}
