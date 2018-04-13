// library imports
const mongoose = require('mongoose')

// project imports
const ModelCreator = require("./ModelCreator")

const ReferredUser = new mongoose.Schema({
  user_id: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  status: { type: String, required: true, default: 'sent' }
})

let model = ModelCreator('Referral', {
  code: { type: String, unique: true, required: true },
  users_referred: { type: [ReferredUser], default: [] },
  referring_user: { type: mongoose.Schema.ObjectId, ref: 'User' }
})

module.exports = model