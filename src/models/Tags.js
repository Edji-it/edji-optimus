const ModelCreator = require('./ModelCreator').default

module.exports = ModelCreator('Tags', {
  userId: { type: String, ref: 'User', required: true },
  values: [{ type: String, required: true }],
})
