var mongoose = require("mongoose")

module.exports = mongoose.model("Tags", {
  userId: { type: String, ref: "User", required: true },
  values: [{ type: String, required: true }]
})