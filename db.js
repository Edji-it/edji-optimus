var mongoose = require("mongoose")
var config = require("config")
var dbConfig = config.get("Database")

var connect = function(mongooseInstance) {
    //sets up database connection based on current NODE_ENV
    console.log(dbConfig.message)
    mongooseInstance.connect(dbConfig.host, { 
        user:dbConfig.user, 
        password:dbConfig.password,
        server: {
            socketOptions: {
                socketTimeoutMS: 120000,
                connectionTimeout: 120000
            }
        }
    })
    
    mongooseInstance.connection.on("error", console.error.bind(console, "connection error:"))
    mongooseInstance.connection.once("open", function(){
        console.log("Connected to Mongo!")
    })
}

connect(mongoose)

module.exports = mongoose