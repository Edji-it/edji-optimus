import { captureException } from '@sentry/node'
import elastic from '../services/elasticsearch'

export interface SaveAndIndexOptions {
  save: Promise<any>
  index?: Promise<any>
  indexName?: string
  id?: string
}
interface SaveAndIndexResults {
  saveResults: any
  indexResults?: any
}

export async function executeSaveAndIndex({ save, index, indexName, id }: SaveAndIndexOptions): Promise<SaveAndIndexResults> {
  let queue: Array<Promise<any>> = []
  queue.push(wrapSave(save))
  index && queue.push(wrapSave(index))

  let [saveResults, indexResults] = await Promise.all(queue)

  let indexFailed: boolean = !!(indexResults && indexResults.isError)
  let saveFailed: boolean = saveResults.isError

  if (saveFailed || indexFailed) {
    if (saveFailed && indexFailed) {
      captureException(indexResults) // might remove this later, but for now i'm very interested to know whenever indexing fails
      // reject stuff
      return Promise.reject(saveResults)
    } else if (saveFailed) {
      try {
        // roll back the index
        await elastic.delete({
          index: indexName,
          type: 'default',
          id
        })
      } catch (err) {
        captureException(err)
      }
      return Promise.reject(saveResults)
    } else if (indexFailed) {
      // log error but return a success
      captureException(indexResults)
      return { saveResults }
    }
  } else {
    return {
      saveResults,
      indexResults // can be undefined so watch out!
    }
  }
}

// we return errors in the success path so that we can tell exactly what errored out when we call Promise.all
//  and handle that error specifically
let wrapSave = async (save: Promise<any>): Promise<any> => {
  try {
    return await save
  } catch (error) {
    error.isError = true
    return error
  }
}