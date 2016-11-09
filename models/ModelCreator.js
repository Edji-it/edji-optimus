/**
 * Created by bvfergus on 3/5/16.
 */
// var mongoose = require("mongoose");
var timestamps = require("mongoose-timestamp");
var db = require("./../db");

//all models are created through this function
module.exports = function(modelName, schemaJson, schemaDecorator){

    var Schema = new db.Schema(schemaJson);

    Schema.plugin(timestamps);

    if (typeof schemaDecorator === "function"){
        schemaDecorator(Schema);
    }
    var Model = db.model(modelName, Schema);

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