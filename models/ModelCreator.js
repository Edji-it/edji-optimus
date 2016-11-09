/**
 * Created by bvfergus on 3/5/16.
 */
var mongoose = require("mongoose");
var timestamps = require("mongoose-timestamp");
var config = require("config");
var dbConfig = config.get("Database");

// // Set relevant db
// if (process.env.NODE_ENV == 'prod') {
//     // Prod db
//     console.log("Wiring up the production DB");
//     mongoose.connect('mongodb://edjiuser:edjiuser1@ds023408.mlab.com:23408/edji', {user:"edjiuser", password:"edjiuser1"});
// } else {
//     // Dev db
//     console.log("Wiring up the Dev DB");
//     mongoose.connect('mongodb://edjiuser:edjiuser1@ds059306.mlab.com:59306/edji-dev', {user:"edjiuser", password:"edjiuser1"});
// }

//sets up database connection based on current NODE_ENV
console.log(dbConfig.message);
mongoose.connect(dbConfig.host, { user:dbConfig.user, password:dbConfig.password });

mongoose.connection.on("error", console.error.bind(console, "connection error:"));
mongoose.connection.once("open", function(){
    console.log("Connected to Mongo!");
});

module.exports = function(modelName, schemaJson, schemaDecorator){

    var Schema = new mongoose.Schema(schemaJson);

    Schema.plugin(timestamps);

    if (typeof schemaDecorator === "function"){
        schemaDecorator(Schema);
    }
    var Model = mongoose.model(modelName, Schema);

    Model.prototype.oldSave = Model.prototype.save;
    Model.prototype.save = function(callback){
        if (this._id) {
            Model.findOneAndUpdate({_id:this._id}, this, {new:true,upsert:true,overwrite:true}, callback);
        } else {
            this.oldSave(callback);
        }

    };

    return Model;
};
