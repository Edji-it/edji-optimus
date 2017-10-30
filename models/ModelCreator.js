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

    Model.prototype.save = function(options, callback) {
        if (!options) {
            options = {
                forceSave: this._id ? false : true
            }
        }

        if (options.forceSave) {
            this.forceSave(callback);
        } else {
            let queryOptions = Object.assign({
                query: { _id: this._id },
                update: this,
                mongooseOptions: {
                    new: true,
                    runValidators: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            }, options)

            Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions, callback);
        }
    };

    return Model;
};