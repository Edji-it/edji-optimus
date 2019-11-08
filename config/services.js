const joi = require('joi')

const serviceSchema = joi.object({
  MONGO_HOST: joi.string().required(),
  OAUTH2_GOOGLE_CLIENT_ID: joi.string().required(),
  OAUTH2_GOOGLE_CLIENT_SECRET: joi.string().required(),
  STRIPE_API_TOKEN: joi.string().required(),
  MAILCHIMP_API_TOKEN: joi.string().required(),
  EDJI_GRAPPLE_DOMAIN: joi.string().required(),
  EDJI_GRAPPLE_TOKEN: joi.string().required(),
  EDJI_BLUESTREAK_DOMAIN: joi.string().required(),
  EDJI_BLUESTREAK_TOKEN: joi.string().required(),
  EDJI_PIPO_DOMAIN: joi.string().required(),
  EDJI_PIPO_TOKEN: joi.string().required(),
  EDJI_QUICKSHADOW_DOMAIN: joi.string().required(),
  EDJI_FLAK_TOKEN: joi.string().required(),
  EDJI_FLAK_URL: joi.string().required(),
  OAUTH2_CLEVER_CLIENT_ID: joi.string().required(),
  OAUTH2_CLEVER_CLIENT_SECRET: joi.string().required(),
  AWS_ACCESS_KEY_ID: joi.string().required(),
  AWS_SECRET_ACCESS_KEY: joi.string().required(),
})

const { error, value: serviceVars } = serviceSchema.validate(process.env, { allowUnknown: true })
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

module.exports = serviceVars
