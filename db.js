var mongoose = require("mongoose");
var mockgoose = require("mockgoose");
var config = require("config");
var dbConfig = config.get("Database");

var connect = function(mongooseInstance) {
    //sets up database connection based on current NODE_ENV
    console.log(dbConfig.message);
    mongooseInstance.connect(dbConfig.host, { user:dbConfig.user, password:dbConfig.password });
    
    mongooseInstance.connection.on("error", console.error.bind(console, "connection error:"));
    mongooseInstance.connection.once("open", function(){
        console.log("Connected to Mongo!");
    });
}

// //hook for mockgoose to intercept if running in test mode
// if (config.util.getEnv("NODE_ENV") === "test") {
//     console.log("test db");
//     mockgoose(mongoose).then(function() {
//         connect(mongoose);
//     });
// } else {
    connect(mongoose);
// }

module.exports = mongoose;