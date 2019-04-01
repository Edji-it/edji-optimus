const mongoose = require('mongoose')
let ModelCreator = require('./ModelCreator')
let Question = require('./Question')
let Tags = require('./Tags')

const indexableProperties = [
  'html',
  'title',
  'parent_id',
  'owner_id',
  'public',
  'questions',
  'promoter_ids',
  'source',
  'cover_img',
  'tags',
  'draft',
  'grade_levels',
  'subjects',
  'version_id',
  'owner_bookmarked',
  'createdAt',
  'updatedAt',
]

module.exports = ModelCreator(
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
    tags: [Tags.schema],
    draft: { type: Boolean },
    grade_levels: [Number],
    subjects: [String],
    version_id: { type: mongoose.Schema.ObjectId, ref: 'ReadingVersion', required: true },
    owner_bookmarked: { type: Boolean },
  },
  function(schema) {
    schema.methods.getIndexOptions = function() {
      let body = {}
      let len = indexableProperties.length
      for (let i = 0; i < len; i++) {
        let propertyName = indexableProperties[i]
        body[propertyName] = this[propertyName]
      }
      return {
        index: 'readings',
        type: 'default',
        id: this._id.toString(),
        body,
      }
    }
  },
)
