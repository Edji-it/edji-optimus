const ModelCreator = require('./ModelCreator').default

const TagsModel = ModelCreator('Tags', {
  userId: { type: String, ref: 'User', required: true },
  values: [{ type: String, required: true }],
})

export default TagsModel
