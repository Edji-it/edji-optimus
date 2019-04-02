/**
 * Comment Model
 * - Attached to Project objects
 */
import { Document, Model, Schema } from 'mongoose'
import { ObjectID } from 'mongodb'
const ModelCreator = require('./ModelCreator')

const Comment: Model<iComment> = ModelCreator('Comment', {
  user_id: { type: String, required: true }, // could be any type of user, maybe we want to add a user_type field?
  start: { type: Number, required: true, default: -1 },
  end: { type: Number, required: true, default: -1 },
  data: String,
  dataArray: Array,
  url: { type: String },
  author: String, // user's name, stored for easy access
  text: String, // the text which the comment is on!
  type: String, // type of comment (should be required)
  loc: {
    x: Number,
    y: Number,
  },
  reply_to: { type: Schema.Types.ObjectId, ref: 'Comment' },
  replies: Array,
  questionId: String,
})

export default Comment

export interface iComment extends Document {
  user_id: string
  start: number
  end: number
  data?: string
  dataArray?: any[]
  url?: string
  author?: string
  text?: string
  type?: string
  loc?: {
    x: number
    y: number
  }
  reply_to: ObjectID
  replies: any[]
  questionId: string
}
