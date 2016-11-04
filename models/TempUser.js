var ModelCreator = require("./ModelCreator");

var model = ModelCreator("TempUser", {
    author: {type: String, required: true},
    timer: {type: Date, required: true, default: Date.now, expires: 60*60*24}
});

module.exports = model;