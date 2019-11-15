const ModelCreator = require('./ModelCreator').default

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

const CodeModel = ModelCreator('SessionCode', codeSchema, function(schema) {})

export default CodeModel
