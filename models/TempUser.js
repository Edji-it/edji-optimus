var ModelCreator = require("./ModelCreator");

var model = ModelCreator("TempUser", {
    fullname: {type: String, required: true},
    type: {type: String, required: true, default: "temp"},
    timer: {type: Date, required: true, default: Date.now, expires: 60*60*24}
});

module.exports = model;