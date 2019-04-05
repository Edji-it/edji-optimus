const ModelCreator = require('./ModelCreator')

module.exports = ModelCreator('Tags', {
  userId: { type: String, ref: 'User', required: true },
  values: [{ type: String, required: true }],
})
