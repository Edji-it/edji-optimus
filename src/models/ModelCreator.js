/**
 * Created by bvfergus on 3/5/16.
 */
var db = require("./../db")

//all models are created through this function
module.exports = function(modelName, schemaJson, schemaDecorator){

    schemaJson.createdAt = { type: Date, default: Date.now }
    schemaJson.updatedAt = { type: Date, default: Date.now }

    var Schema = new db.Schema(
        schemaJson,
        {
            id: false, // tells mongoose not to create a copy of the _id field as 'id'
            toObject: { virtuals: true }, // makes mongoose virtuals accessible to functions
            toJSON: { virtuals: true } // makes mongoose virtuals accessible to JSON responses
        }
    )

    Schema.pre('edjiSave', function(next) {
        console.log('in edjiSave')
        var now = new Date()
        this.updatedAt = now
        next()
    })    

    if (typeof schemaDecorator === "function"){
        schemaDecorator(Schema)
    }

    Schema.methods.forceSave = Schema.methods.save

    Schema.methods.edjiSave = function(options, callback) {
        if (!options) {
            options = {
                forceSave: this._id ? false : true
            }
        }

        if (options.forceSave) {
            this.save(callback)
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
            
            return Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions, callback)
        }
    }

    var Model = db.model(modelName, Schema)

    return Model
}