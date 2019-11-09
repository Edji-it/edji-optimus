import mongoose = require('mongoose')

mongoose.Promise = Promise
// hacky old assignment before typescript - now using the middleware in route is prefered
mongoose['validateEdjiId'] = require('./middleware/validate-ids').isValidId

//sets up database connection based on current EDJI_STAGE
console.log('wiring up the database for ' + process.env.EDJI_STAGE)
mongoose.connect(process.env.MONGO_HOST, <any>{
  socketTimeoutMS: 120000,
  useNewUrlParser: true,
  retryWrites: false,
})

mongoose.connection.on('error', console.error.bind(console, 'connection error:'))
mongoose.connection.once('open', function() {
  console.log('Connected to Mongo!')
})

// when something interrupts the process, disconnect from mongodb
process.on('SIGINT', () => {
  mongoose.disconnect(err => {
    process.exit(err ? 1 : 0)
  })
})

export default mongoose
