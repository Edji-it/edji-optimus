import { CloudFormation } from 'aws-sdk'

const cf = new CloudFormation()

const getAllExports: () => Promise<CloudFormation.Export[]> = async () => {
  let allExports: CloudFormation.Export[] = []
  await cf
    .listExports()
    .promise()
    .then(({ Exports, NextToken }) => {
      allExports = allExports.concat(Exports)
      if (NextToken) return cf.listExports({ NextToken }).promise()
    })
    .catch(err => {
      throw err
    })
  return allExports
}

const getEnv = () => (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')

const envMap = {
  [`reading-index-queue-${getEnv()}`]: 'INDEX_READING_QUEUE_URL',
}

export const initializeCloudFormationEnv = async () => {
  const exp = await getAllExports()
  exp.forEach(({ Name, Value }) => {
    if (envMap[Name]) process.env[envMap[Name]] = Value
  })
}
