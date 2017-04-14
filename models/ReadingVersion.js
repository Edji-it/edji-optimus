var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")

module.exports = ModelCreator("ReadingVersion", {
  _id: { type: mongoose.Schema.ObjectId, required: true, default: mongoose.Types.ObjectId() },
  readings: { type: [mongoose.Schema.ObjectId], ref: "Reading", required: true }
})