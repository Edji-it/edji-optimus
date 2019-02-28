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
  OAUTH2_CLEVER_CLIENT_ID: joi.string().required(),
  OAUTH2_CLEVER_CLIENT_SECRET: joi.string().required()
})

const { error, value: serviceVars } = serviceSchema.validate(process.env, { allowUnknown: true })
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  MONGO: {
    HOST: serviceVars.MONGO_HOST
  },
  OAUTH: {
    GOOGLE: {
      CLIENT_ID: serviceVars.OAUTH2_GOOGLE_CLIENT_ID,
      CLIENT_SECRET: serviceVars.OAUTH2_GOOGLE_CLIENT_SECRET
    }
  },
  STRIPE: {
    API_KEY: serviceVars.STRIPE_API_TOKEN
  },
  EDJI_API: {
    GRAPPLE: {
      DOMAIN: serviceVars.EDJI_GRAPPLE_TOKEN,
      TOKEN: serviceVars.EDJI_GRAPPLE_TOKEN
    }
  },
  MAILCHIMP: {
    TOKEN: serviceVars.MAILCHIMP_API_TOKEN
  }
}

module.exports = config