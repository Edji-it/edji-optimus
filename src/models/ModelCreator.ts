// library imports
import { Model, Document, Schema, SchemaDefinition } from 'mongoose'
import { captureException } from '@sentry/node'
import { ObjectId } from 'mongodb'

// local imports
import db from './../db'
import { indexDocuments } from '../services/flak'

const updateDocumentIndex = (collection, id: ObjectId | string) => {
  if (id instanceof ObjectId) id = id.toHexString()
  indexDocuments({ collection, documents: [id] }).catch(err => {
    captureException(err)
  })
}

//all models are created through this function
const ModelCreator = function(
  modelName: string,
  schemaJson: SchemaDefinition,
  schemaDecorator: (schema: Schema) => void,
) {
  schemaJson.createdAt = { type: Date, default: Date.now }
  schemaJson.updatedAt = { type: Date, default: Date.now }

  let Schema = new db.Schema(schemaJson, {
    id: false, // tells mongoose not to create a copy of the _id field as 'id'
    toObject: { virtuals: true }, // makes mongoose virtuals accessible to functions
    toJSON: { virtuals: true }, // makes mongoose virtuals accessible to JSON responses
  })

  Schema.methods.edjiSave = async function(options = {}) {
    this.preEdjiSave && (await this.preEdjiSave())
    this.updatedAt = Date.now()
    // mongoose does this stupid thing where it overwrites the last parameter as a callback
    //  if the method has hooks. So, if you don't pass a callback, then it will overwrite options and
    //  the functionality you expect won't happen. I think there's a way to fix this by making it apparent that
    //  the function returns a promise, but somehow we're not doing that right so I'm just going to
    //  make sure it throws an error if you're gonna use it wrong.
    //  p.s. I think it has something to do with using Model before it is defined
    if (typeof options !== 'object') {
      return Promise.reject(
        `edjiSave expected to receive an options object, but instead receive typeof ${typeof options}`,
      )
    }

    let error = this.validateSync()
    if (error) throw error

    const results = await this.save()
    if (this.getIndexOptions) {
      let { collection }: IndexOptions = this.getIndexOptions()
      // this gets fired asynchronously, so that we don't wait for it
      updateDocumentIndex(collection, this._id)
    }

    return results
  }

  if (typeof schemaDecorator === 'function') {
    schemaDecorator(Schema)
  }

  Schema.statics.updateIndex = function(id: ObjectId) {
    if (this.getIndexOptions) {
      const { collection } = this.getIndexOptions()
      updateDocumentIndex(collection, id)
    }
  }

  return db.model(modelName, Schema)
}

export default ModelCreator

export interface IndexOptions {
  collection: any // really a string with a type, but couldn't easily type this
}

export interface EdjiModel extends Model<any> {
  getIndexOptions: () => IndexOptions
  updateIndex?: (id: ObjectId | string) => void
}

export interface EdjiDocument extends Document {
  edjiSave: () => Promise<any>
}
