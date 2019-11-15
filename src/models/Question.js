const ModelCreator = require('./ModelCreator').default

let answerTypesEnum = {
  values: ['open-ended'],
  message: 'answer types enum validator failed for path `{PATH}` with value `{VALUE}`',
}

let commentTypesEnum = {
  values: ['emoji', 'text', 'audio', 'reply'],
  message: 'comment types enum validator failed for path `{PATH}` with value `{VALUE}`',
}

let optionTypesEnum = {
  values: ['public', 'lock'],
  message: 'option types enum validator failed for path `{PATH}` with value `{VALUE}`',
}

let Model = ModelCreator('Question', {
  prompt: { type: String, required: true },
  type: { type: String, enum: answerTypesEnum, default: 'open-ended' },
  answer_types: [{ type: String, enum: commentTypesEnum, default: 'text' }],
  option_types: [{ type: String, enum: optionTypesEnum }],
})

module.exports = Model
