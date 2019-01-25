import { executeSaveAndIndex, SaveAndIndexOptions } from "./_ModelCreator"
import elastic from './../elasticsearch'

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

    if (typeof schemaDecorator === "function") {
        schemaDecorator(Schema)
    }

    Schema.methods.edjiSave = async function (options: EdjiSaveOptions = {}, next) {
        this.updatedAt = Date.now()
        // mongoose does this stupid thing where it overwrites the last parameter as a callback
        //  if the method has hooks. So, if you don't pass a callback, then it will overwrite options and
        //  the functionality you expect won't happen. I think there's a way to fix this by making it apparent that 
        //  the function returns a promise, but somehow we're not doing that right so I'm just going to
        //  make sure it throws an error if you're gonna use it wrong.
        //  p.s. I think it has something to do with using Model before it is defined
        if (typeof options !== 'object') {
            return Promise.reject(`edjiSave expected to receive an options object, but instead receive typeof ${typeof options}`)
        }

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

        let saveOptions: SaveAndIndexOptions = {
            save: Model.findOneAndUpdate(queryOptions.query, queryOptions.update, queryOptions.mongooseOptions)
        }
        if (this.getIndexOptions) {
            let indexOptions: IndexOptions = this.getIndexOptions()
            saveOptions.index = elastic.index(indexOptions)
            saveOptions.id = indexOptions.id
            saveOptions.indexName = indexOptions.index
        }

        if (options.forceSave) {
            saveOptions.save = this.save()
        }

        let { saveResults, indexResults } = await executeSaveAndIndex(saveOptions)
        return saveResults
    }

    const Model = db.model(modelName, Schema)
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

export interface IndexOptions {
    index: string
    type: string
    id: string
    body: string
}