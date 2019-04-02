const mongoose = require('mongoose')

const connect = function(mongooseInstance) {
  //sets up database connection based on current NODE_ENV
  console.log('wiring up the database for ' + process.env.NODE_ENV)
  mongooseInstance.connect(process.env.MONGO_HOST, {
    socketTimeoutMS: 120000,
    connectionTimeout: 120000,
  })

  mongooseInstance.connection.on('error', console.error.bind(console, 'connection error:'))
  mongooseInstance.connection.once('open', function() {
    console.log('Connected to Mongo!')
  })
}

mongoose.validateEdjiId = require('./middleware/validate-ids').isValidId

connect(mongoose)

mongoose.Promise = Promise

module.exports = mongoose
