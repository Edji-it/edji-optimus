ModelCreator = require('./ModelCreator').default

const codeSchema = {
  code: {
    type: String,
    unique: true,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
}

const model = ModelCreator('SessionCode', codeSchema, function(schema) {})

module.exports = model
