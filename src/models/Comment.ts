/**
 * Comment Model
 * - Attached to Project objects
 */
import { Document, Schema } from 'mongoose'
import { ObjectID } from 'mongodb'
const ModelCreator = require('./ModelCreator').default

const Comment: any = ModelCreator('Comment', {
  user_id: { type: String, required: true }, // could be any type of user, maybe we want to add a user_type field?
  author: String, // user's name, stored for easy access
  recipient_id: String, // for mentions and feedback
  start: { type: Number, required: true, default: -1 },
  end: { type: Number, required: true, default: -1 },
  data: String,
  dataArray: Array,
  url: { type: String },
  text: String, // the text which the comment is on!
  type: String, // type of comment (should be required)
  loc: {
    x: Number,
    y: Number,
  },
  box: {
    start: Number,
    end: Number,
    start_x: Number,
    start_y: Number,
  },
  reply_to: { type: Schema.Types.ObjectId, ref: 'Comment' },
  replies: Array,
  questionId: String,
})

export default Comment

interface iCommentModel extends iComment, Document {}

export interface iComment {
  user_id: string
  author?: string
  recipient_id?: string
  start: number
  end: number
  data?: string
  dataArray?: any[]
  url?: string
  text?: string
  type?: string
  loc?: {
    x: number
    y: number
  }
  box?: {
    start: number
    end: number
    start_x: number
    start_y: number
  }
  reply_to?: ObjectID
  replies?: any[]
  questionId?: string
}
