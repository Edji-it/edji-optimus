// library imports
const mongoose = require('mongoose')

// project imports
const ModelCreator = require("./ModelCreator")

// define the schema for a single message independently, for readability and b/c mongoose won't let you specify an array easily
const messageSchema = new mongoose.Schema({
  key: String,
  added_at_time: Date
})

let model = ModelCreator('MessageList', {
  messages: { type: [messageSchema], default: []},
  last_message_check_time: { type: Date, default: Date.now() }
})

module.exports = model