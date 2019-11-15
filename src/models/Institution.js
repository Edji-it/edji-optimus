/**
 * Institution Model
 */
var ModelCreator = require('./ModelCreator').default
var mongoose = require('mongoose')

var Model = ModelCreator('Institution', {
  name: { type: String, required: true }, // indicating the institution's full name
  abbreviation: { type: String }, // indicating the institution's preferred abbreviation
  // logo: { type: String }, // perhaps we could have a logo url to display at some point - not now
  license_ids: [{ type: mongoose.Schema.ObjectId }], // license id's which belong to this institution
  parent_institution: { type: mongoose.Schema.ObjectId }, // id of the overarching institution
  outcomes: [
    {
      short_name: { type: String, maxlength: 50, required: true },
      outcome_statement: { type: String, required: true },
      rubric: [
        {
          grade: { type: Number, required: true },
          rubric_statement: { type: String, required: true },
        },
      ],
      standard: { type: mongoose.Schema.ObjectId, required: true, ref: 'Standard' },
    },
  ],
})

module.exports = Model
