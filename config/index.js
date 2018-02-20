const env = require('./env')
const services = require('./services')

const config = Object.assign(
  {},
  env,
  services
)

module.exports = config