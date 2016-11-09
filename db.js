var mockgoose = require("mockgoose");
var config = require("config");
var dbConfig = config.get("Database");

module.exports = {
    connect:function(mongoose) {
        this.prepare(mongoose).then(function() {
            //sets up database connection based on current NODE_ENV
            console.log(dbConfig.message);
            mongoose.connect(dbConfig.host, { user:dbConfig.user, password:dbConfig.password });
            
            mongoose.connection.on("error", console.error.bind(console, "connection error:"));
            mongoose.connection.once("open", function() {
                console.log("Connected to Mongo!");
            });
        });
    },
    prepare:function(mongoose) {
        return new Promise(function(resolve, reject) {
            if (config.util.getEnv('NODE_ENV') == "test") {
                mockgoose(mongoose).then(function() {
                    resolve(mongoose);
                });
            } else {
                resolve(mongoose);
            }
        });
        
    }
}