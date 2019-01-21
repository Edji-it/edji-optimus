import { executeSaveAndIndex, SaveAndIndexOptions } from "./_ModelCreator";

const db = require("./../db")

//all models are created through this function
module.exports = function (modelName, schemaJson, schemaDecorator) {

    schemaJson.createdAt = { type: Date, default: Date.now }
    schemaJson.updatedAt = { type: Date, default: Date.now }

    let Schema = new db.Schema(
        schemaJson,
        {
            id: false, // tells mongoose not to create a copy of the _id field as 'id'
            toObject: { virtuals: true }, // makes mongoose virtuals accessible to functions
            toJSON: { virtuals: true } // makes mongoose virtuals accessible to JSON responses
        }
    )

    Schema.pre('edjiSave', function (next) {
        let now = new Date()
        this.updatedAt = now
        next()
    })

    if (typeof schemaDecorator === "function") {
        schemaDecorator(Schema)
    }

    Schema.methods.edjiSave = async function (options: EdjiSaveOptions, cb) {
        console.log('options', options)
        console.log('callback', cb)
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

        let operations: SaveAndIndexOptions = {
            save: Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions)
        }
        if (this.indexMyself)
            operations.index = this.indexMyself()

        if (options.forceSave) {
            operations.save = this.save()
        }

        let { saveResults, indexResults } = await executeSaveAndIndex(operations)
        return saveResults
    }

    var Model = db.model(modelName, Schema)

    return Model
}

interface EdjiSaveOptions {
    query?: any
    update?: any
    mongooseOptions?: {
        new: boolean
        runValidators: boolean
        upsert: boolean
        setDefaultsOnInsert: boolean
    }
    forceSave?: boolean
}