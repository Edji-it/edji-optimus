/**
 * Created by bvfergus on 3/5/16.
 */
var db = require("./../db");

//all models are created through this function
module.exports = function(modelName, schemaJson, schemaDecorator){

    schemaJson.createdAt = { type: Date, default: Date.now };
    schemaJson.updatedAt = { type: Date, default: Date.now };

    var Schema = new db.Schema(schemaJson);

    Schema.pre('save', function(next) {
        var now = new Date();
        this.updatedAt = now;
        next();
    });    

    if (typeof schemaDecorator === "function"){
        schemaDecorator(Schema);
    }
    var Model = db.model(modelName, Schema);

    Model.prototype.forceSave = Model.prototype.save;

    Model.prototype.save = function(callback){
        if (this._id) {
            Model.findByIdAndUpdate({_id:this._id}, this, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }, callback);
        } else {
            this.forceSave(callback);
        }
    };

    return Model;
};