var ModelCreator = require("./ModelCreator");
var mongoose = require("mongoose");

var model = ModelCreator("ArchivedUser", {
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  fullname: { type: String }
});

module.exports = model;