const joi = require('joi')

const optimusSchema = joi.object({
  OPTIMUS_PW_SECRET: joi.string().required(),
  OPTIMUS_TOKEN_SIGNING_SECRET: joi.string().required(),
})

const { error, value: optimusVars } = optimusSchema.validate(process.env, { allowUnknown: true })
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

module.exports = optimusVars
