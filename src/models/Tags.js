var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")

module.exports = ModelCreator("Tags", {
  userId: {type: String, ref: "User", required: true},
  values: [{type: String, required: true}]
})