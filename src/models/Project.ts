/**
 * Project Model
 */
const mongoose = require('mongoose')
const Tags = require('./Tags').default

// project imports
const SessionCode = require('./SessionCode').default
import Comment from './Comment'
import Feedback from './Feedback'
const ModelCreator = require('./ModelCreator').default

/** mongoose hook for validation against acceptable values for `types` */
const typesEnum = {
  values: ['emoji', 'text', 'audio', 'reply'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`',
}

const ProjectModel: any = ModelCreator(
  'Project',
  {
    teacher_id: { type: mongoose.Schema.ObjectId, required: true, ref: 'User' },
    co_owner_ids: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    reading_id: { type: mongoose.Schema.ObjectId, required: true, ref: 'Reading' },
    comments: [Comment.schema],
    answers: [Comment.schema],
    report_evals: [Comment.schema],
    feedback: [Feedback.schema],
    students_ids: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    temp_ids: [{ type: mongoose.Schema.ObjectId, ref: 'TempUser' }],
    label: { type: String, required: true },
    code: { type: String, unique: true },
    types: [{ type: String, enum: typesEnum, default: 'emoji' }],
    tags: [Tags.schema],
    heat_vision: { type: Boolean, default: false },
    group_instructions: String,
    quick_labels: [String],
    outcomes: [
      {
        outcome_id: { type: mongoose.Schema.ObjectId, required: true },
        outcome_statement: { type: String, required: true },
      },
    ],
  },
  schema => {
    // grab a session code and add it to the project before saving
    schema.methods.preEdjiSave = async function() {
      if (this.code) return
      let result = await SessionCode.findOne({ active: false })
      this.code = result.code
      result.active = true
      result.edjiSave()
      return
    }

    // add population of user object
    schema.virtual('teacher', {
      ref: 'User',
      localField: 'teacher_id',
      foreignField: '_id',
      justOne: true,
    })

    // add population of reading object
    schema.virtual('reading', {
      ref: 'Reading',
      localField: 'reading_id',
      foreignField: '_id',
      justOne: true,
    })
  },
)

export default ProjectModel
