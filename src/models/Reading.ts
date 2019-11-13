import { EdjiDocument } from './User'
import { Model, Document, Schema } from 'mongoose'

let ModelCreator = require('./ModelCreator')
let Question = require('./Question')

const ReadingModel: ReadingModel = ModelCreator(
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
  function(schema: Schema) {
    schema.methods.getIndexOptions = function() {
      return {
        queueUrl: process.env.INDEX_READING_QUEUE_URL,
        collection: 'readings',
      }
    }

    schema.statics.getIndexOptions = function() {
      return {
        index: 'readings',
        type: 'default',
      }
    }
  },
)

export default ReadingModel

interface iReading {
  html: string
  words: any[]
  title: string
}

interface ReadingDocument extends EdjiDocument, iReading {}
interface ReadingModel extends Model<ReadingDocument> {
  getIndexOptions: () => { index: string; type: string }
}
