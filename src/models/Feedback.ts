/**
 * Feedback Model
 * - Attached to Project objects
 */
import { Document, Types, Model } from 'mongoose'
import { ObjectId } from 'mongodb';
const ModelCreator = require('./ModelCreator')

const Feedback: Model<iFeedback> = ModelCreator("Feedback", {
  owner_id: { type: Types.ObjectId },
  outcome_id: { type: Types.ObjectId },
  feedback_to: { type: Types.ObjectId, ref: "Comment" },
  evaluation: { type: String, required: true },
})

export default Feedback

export interface iFeedback extends Document {
  owner_id: ObjectId
  outcome_id: ObjectId
  feedback_to: ObjectId
  evaluation: string
}