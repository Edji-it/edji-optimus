var ModelCreator = require("./ModelCreator")
var mongoose = require("mongoose")

var Model = ModelCreator("Tags", {
  userId: {type: String, ref: "User", required: true},
  values: [{type: String, required: true}]
})