import { SQS } from 'aws-sdk'

const instance = new SQS({ apiVersion: '2012-11-05' })

const sendMessage = ({ queueUrl, body }: { queueUrl: string; body: any }) => {
  if (typeof body === 'object') body = JSON.stringify(body)
  const params: SQS.SendMessageRequest = {
    QueueUrl: queueUrl,
    MessageBody: body,
  }
  return instance.sendMessage(params).promise()
}

export const sqs = {
  sendMessage,
}
