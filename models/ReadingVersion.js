var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")

module.exports = ModelCreator("ReadingVersion", {
  readings: { type: [mongoose.Schema.ObjectId], ref: "Reading", required: true }
})