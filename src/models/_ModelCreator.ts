import { captureException } from '@sentry/node'
import elastic from './../elasticsearch'

export interface SaveAndIndexOptions {
  save: Promise<any>
  index?: Promise<any>
}
interface SaveAndIndexResults {
  saveResults: any
  indexResults?: any
}

export async function executeSaveAndIndex(_id: string, indexName: string, { save, index }: SaveAndIndexOptions): Promise<SaveAndIndexResults> {
  let queue: Array<Promise<any>> = []
  queue.push(wrapSave(save))
  index && queue.push(wrapSave(index))

  let [saveResults, indexResults] = await Promise.all(queue)
  // console.log('saveResults', saveResults, 'indexResults', indexResults)

  if (saveResults.isError && indexResults && indexResults.isError) {
    captureException(indexResults) // might remove this later, but for now i'm very interested to know whenever indexing fails
    // reject stuff
    return Promise.reject(saveResults)
  } else if (saveResults.isError) {
    // roll back the index
    await elastic.delete({
      index: 'readings',
      type: 'default',
      id: _id
    })
    return Promise.reject(saveResults)
  } else if (indexResults && indexResults.isError) {
    // log error but return a success
    captureException(indexResults)
    return { saveResults }
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
    console.log('error:', error instanceof Error)
    return error
  }
}