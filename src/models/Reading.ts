import { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'

import { EdjiDocument, EdjiModel } from './ModelCreator'

const ModelCreator = require('./ModelCreator').default
const Question = require('./Question').default

const ReadingModel = <ReadingModel>ModelCreator(
  'Reading',
  {
    html: { type: String, required: true },
    words: { type: [], required: true },
    title: { type: String, required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Reading' },
    owner_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    reading_type: {
      type: String,
      enum: { values: ['public', 'private', 'academy'], message: 'invalid reading_type' },
      required: true,
      default: 'private',
    },
    questions: [Question.schema],
    promoter_ids: [String],
    source: String,
    cover_img: String,
    tags: [String],
    draft: { type: Boolean },
    grade_levels: [Number],
    subjects: [String],
    version_id: { type: Schema.Types.ObjectId, ref: 'ReadingVersion', required: true },
    owner_bookmarked: { type: Boolean },
    default_instructions: String,
  },
  function(schema: Schema<ReadingDocument>) {
    schema.methods.getIndexOptions = function() {
      return {
        collection: 'readings',
      }
    }
    schema.statics.getIndexOptions = function() {
      return {
        collection: 'readings',
      }
    }
  },
)

interface iReading {
  html: string
  words: any[]
  title: string
  parent_id: ObjectId
  owner_id: ObjectId
  reading_type: 'public' | 'private' | 'academy'
  questions: any[]
  promoter_ids: string[]
  source: string
  cover_img: string
  tags: string[]
  draft: boolean
  grade_levels: number[]
  subjects: string[]
  version_id: ObjectId
  owner_bookmarked: boolean
  default_instructions: string
}

interface ReadingDocument extends EdjiDocument, iReading {}

interface ReadingModel extends EdjiModel<ReadingDocument> {}

export default ReadingModel
