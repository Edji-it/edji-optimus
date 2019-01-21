import { executeSaveAndIndex } from "./_ModelCreator";

var db = require("./../db")

//all models are created through this function
module.exports = function (modelName, schemaJson, schemaDecorator) {

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

    Schema.pre('edjiSave', function (next) {
        var now = new Date()
        this.updatedAt = now
        next()
    })

    if (typeof schemaDecorator === "function") {
        schemaDecorator(Schema)
    }

    Schema.methods.forceSave = Schema.methods.save

    Schema.methods.edjiSave = async function (options) {
        if (!options) {
            options = {
                forceSave: this._id ? false : true
            }
        }

        let promises = []

        // push the first promise, which is the mongoose interaction
        if (options.forceSave) {
            executeSaveAndIndex(
                this.save(),
                this.indexMyself()
            )
        } else {
            let queryOptions = {
                query: { _id: this._id },
                update: this,
                mongooseOptions: {
                    new: true,
                    runValidators: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                },
                ...options
            }

            console.log('running findOneAndUpdate')
            executeSaveAndIndex(
                Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions),
                this.indexMyself()
            )
        }

        // // if the model has a function for indexing itself, run it
        // if (this.indexMyself) {
        //     promises.push(this.indexMyself())
        // }
        // create array of promises
        // push the model indexing itself
        // push the findoneandupdate
        // return results of findoneandupdate
        // return Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions)
        let results = await Promise.all(promises)
        results.length > 1 && console.log('elasticsearch results', results[1])
        return results[0] // return only the results of the mongoose save operation
    }

    var Model = db.model(modelName, Schema)

    return Model
}