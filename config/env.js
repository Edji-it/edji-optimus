const joi = require('joi')

const envSchema = joi.object({
  NODE_ENV: joi.string()
    .allow(['development', 'production', 'test'])
    .required(),
  PORT: joi.number()
    .required(),
  CLIENT_URL: joi.string()
    .required(),
  OPTIMUS_URL: joi.string().required()
})

const { error, value: envVars } = envSchema.validate(process.env, { allowUnknown: true })
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  ENV: envVars.NODE_ENV,
  SERVER: {
    PORT: envVars.PORT
  },
  CLIENT_URL: envVars.CLIENT_URL
}

module.exports = config