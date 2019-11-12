module.exports = () => {
  const stage = process.env.EDJI_STAGE
  if (stage === 'production' || stage === 'development') {
    return `edji-optimus-${stage}@${require('../package.json').version}`
  }
}
