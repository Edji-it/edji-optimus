import * as AWS from 'aws-sdk'

/** this is the default config for AWS which will be adopted by any service, unless overridden when service is initialized */
AWS.config.update({ region: 'us-east-1' })

export * from './sqs'
export * from './cloudformation'
