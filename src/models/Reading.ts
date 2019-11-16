import { Schema } from 'mongoose'

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
    public: Boolean,
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
  function(schema) {
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

interface iReading {}

interface ReadingDocument extends EdjiDocument, iReading {}

interface ReadingModel extends EdjiModel<ReadingDocument> {}

export default ReadingModel
