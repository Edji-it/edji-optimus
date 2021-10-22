import { ObjectId } from 'mongodb'
import { Schema } from 'mongoose'

/**
 * Module Model
 */
const mongoose = require('mongoose')
const Tags = require('./Tags').default

// Project imports
const ModelCreator = require('./ModelCreator').default

const groupSchema = new Schema({
  project_ids: [{ type: mongoose.Schema.ObjectId, required: true, ref: 'Project' }],
  student_ids: [{ type: mongoose.Schema.ObjectId, required: true, ref: 'User' }],
  temp_ids: [{ type: mongoose.Schema.ObjectId, required: true, ref: 'TempUser' }],
  label: { type: String, required: true },
})

/*
  MODULES:
    - Each module has a set of readings.
    - There are groups that can be created which will go through the readings via projects
    - When groups are created, a set of projects get created based on all the readings
    - When a user gets added to a group, the module shows up on their home page along
      with the readings (as projects) that are contained inside the module.  
*/
const ModuleModel: any = ModelCreator(
  'Module',
  {
    teacher_id: { type: mongoose.Schema.ObjectId, required: true, ref: 'User' },
    co_owner_ids: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    label: { type: String, required: true },
    tags: [Tags.schema],
    reading_ids: [{ type: mongoose.Schema.ObjectId, required: true, ref: 'Reading' }],
    groups: [{ type: groupSchema, required: true }],
  },
  schema => {
    // add population of user object
    schema.virtual('teacher', {
      ref: 'User',
      localField: 'teacher_id',
      foreignField: '_id',
      justOne: true,
    })
  },
)

export default ModuleModel

export interface iModule {
  _id: any
  teacher_id: ObjectId
  co_owner_ids: ObjectId[]
  student_ids: ObjectId[]
  label: string
  tags: any[]
  reading_ids: ObjectId[]
  project_ids: ObjectId[]
}
