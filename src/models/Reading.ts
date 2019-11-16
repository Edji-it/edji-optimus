const mongoose = require('mongoose')
const ModelCreator = require('./ModelCreator').default
const Question = require('./Question').default

const ReadingModel: any = ModelCreator(
  'Reading',
  {
    html: { type: String, required: true },
    words: { type: [], required: true },
    title: { type: String, required: true },
    parent_id: { type: mongoose.Schema.ObjectId, ref: 'Reading' },
    owner_id: { type: mongoose.Schema.ObjectId, required: true, ref: 'User' },
    public: Boolean,
    questions: [Question.schema],
    promoter_ids: [String],
    source: String,
    cover_img: String,
    tags: [String],
    draft: { type: Boolean },
    grade_levels: [Number],
    subjects: [String],
    version_id: { type: mongoose.Schema.ObjectId, ref: 'ReadingVersion', required: true },
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

export default ReadingModel
