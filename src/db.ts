import mongoose = require('mongoose')

mongoose.Promise = Promise
// hacky old assignment before typescript - now using the middleware in route is prefered
mongoose['validateEdjiId'] = require('./middleware/validate-ids').isValidId
const connStr = process.env.MONGO_HOST

//sets up database connection based on current EDJI_STAGE
console.log('wiring up the database for ' + process.env.EDJI_STAGE)
mongoose.connect(connStr, <any>{
  socketTimeoutMS: 120000,
  useNewUrlParser: true,
  retryWrites: false,
  useUnifiedTopology: true,
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
