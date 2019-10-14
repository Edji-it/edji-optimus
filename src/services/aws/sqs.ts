import { SQS } from 'aws-sdk'

const sqs = new SQS({ apiVersion: '2012-11-05' })

const sendMessage = (params: SQS.SendMessageRequest) => {
  return sqs.sendMessage(params).promise()
}

export const edjiSQS = {
  sendMessage,
}
