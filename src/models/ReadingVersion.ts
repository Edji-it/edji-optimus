const ModelCreator = require('./ModelCreator').default
const mongoose = require('mongoose')

const ReadingVersionModel: any = ModelCreator('ReadingVersion', {
  readings: { type: [mongoose.Schema.ObjectId], ref: 'Reading', required: true },
  owner_id: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
})

export default ReadingVersionModel
