const env = require('./env')
const services = require('./services')
const optimus = require('./optimus')

const config = Object.assign({}, env, services, optimus)

module.exports = config
