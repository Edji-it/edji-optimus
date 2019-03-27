/**
 * Feedback Model
 * - Attached to Project objects
 */
const mongoose = require('mongoose')
const ModelCreator = require('./ModelCreator')

const Model = ModelCreator("Feedback", {
  outcome_id: { type: mongoose.Schema.ObjectId },
  feedback_to: { type: mongoose.Schema.ObjectId, ref: "Comment" },
  evaluation: { type: String, required: true }
})

module.exports = Model
