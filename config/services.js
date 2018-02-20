const joi = require('joi')

const serviceSchema = joi.object({
  MONGO_HOST: joi.string().required(),
  MONGO_USER: joi.string().required(),
  MONGO_PWD: joi.string().required(),
  MANDRILL_API_KEY: joi.string().required(),
  OAUTH2_GOOGLE_CLIENT_ID: joi.string().required(),
  OAUTH2_GOOGLE_CLIENT_SECRET: joi.string().required(),
  STRIPE_API_TOKEN: joi.string().required()
})

const { error, value: serviceVars } = serviceSchema.validate(process.env, { allowUnknown: true })
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  MONGO: {
    HOST: serviceVars.MONGO_HOST,
    USER: serviceVars.MONGO_USER,
    PWD: serviceVars.MONGO_PWD
  },
  MANDRILL: {
    API_KEY: serviceVars.MANDRILL_API_KEY
  },
  OAUTH: {
    GOOGLE: {
      CLIENT_ID: serviceVars.OAUTH2_GOOGLE_CLIENT_ID,
      CLIENT_SECRET: serviceVars.OAUTH2_GOOGLE_CLIENT_SECRET
    }
  },
  STRIPE: {
    API_KEY: serviceVars.STRIPE_API_TOKEN
  }
}

module.exports = config