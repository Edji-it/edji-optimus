var mongoose = require("mongoose");
var config = require("config");
var dbConfig = config.get("Database");

//sets up database connection based on current NODE_ENV
console.log(dbConfig.message);
mongoose.connect(dbConfig.host, { user:dbConfig.user, password:dbConfig.password });

mongoose.connection.on("error", console.error.bind(console, "connection error:"));
mongoose.connection.once("open", function(){
    console.log("Connected to Mongo!");
});

module.exports = mongoose;