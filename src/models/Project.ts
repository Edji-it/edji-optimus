// library imports
import { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'

// project imports
const SessionCode = require('./SessionCode')
const Tags = require('./Tags')
import Comment, { iComment } from './Comment'
import Feedback from './Feedback'
import ModelCreator, { EdjiDocument } from './ModelCreator'

/** mongoose hook for validation against acceptable values for `types` */
const typesEnum = {
  values: ['emoji', 'text', 'audio', 'reply'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`',
}

const ProjectModel = ModelCreator<ProjectDocument>(
  'Project',
  {
    teacher_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    co_owner_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reading_id: { type: Schema.Types.ObjectId, required: true, ref: 'Reading' },
    comments: [Comment.schema],
    answers: [Comment.schema],
    feedback: [Feedback.schema],
    students_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    temp_ids: [{ type: Schema.Types.ObjectId, ref: 'TempUser' }],
    label: { type: String, required: true },
    code: { type: String, unique: true },
    types: [{ type: String, enum: typesEnum, default: 'emoji' }],
    tags: [Tags.schema],
    heat_vision: { type: Boolean, default: false },
    report_evals: [
      {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        evaluation: { type: String, required: true },
        createdAt: { type: Date, required: true, default: Date.now() },
      },
    ],
    group_instructions: String,
    outcomes: [
      {
        outcome_id: { type: Schema.Types.ObjectId, required: true },
        outcome_statement: { type: String, required: true },
      },
    ],
  },
  (schema: Schema<ProjectDocument>) => {
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

interface iProject {
  comments: iComment[]
  teacher_id: ObjectId
  co_owner_ids: ObjectId[]
}

interface ProjectDocument extends EdjiDocument, iProject {}
