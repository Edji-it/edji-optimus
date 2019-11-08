import mongoose = require('mongoose')

mongoose.Promise = Promise
// hacky old assignment before typescript - now using the middleware in route is prefered
mongoose['validateEdjiId'] = require('./middleware/validate-ids').isValidId

//sets up database connection based on current NODE_ENV
console.log('wiring up the database for ' + process.env.NODE_ENV)
mongoose.connect(process.env.MONGO_HOST, {
  socketTimeoutMS: 120000,
  useNewUrlParser: true,
})

mongoose.connection.on('error', console.error.bind(console, 'connection error:'))
mongoose.connection.once('open', function() {
  console.log('Connected to Mongo!')
})

export default mongoose
