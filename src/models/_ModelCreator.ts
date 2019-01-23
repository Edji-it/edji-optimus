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

export async function executeSaveAndIndex(id: string, { save, index }: SaveAndIndexOptions): Promise<SaveAndIndexResults> {
  let queue: Array<Promise<any>> = []
  queue.push(wrapSave(save))
  index && queue.push(wrapSave(index))

  let [saveResults, indexResults] = await Promise.all(queue)
  if (saveResults.error) {

    // roll delete the indexed object
  }
  if (indexResults && indexResults.error) {
    captureException(new Error('error during elastic indexing of document'))
  }

  return {
    saveResults,
    indexResults // can be undefined so watch out!
  }
}

// we return errors in the success path so that we can tell exactly what errored out when we call Promise.all
//  and handle that error specifically
let wrapSave = async (save: Promise<any>): Promise<any> => {
  try {
    return await save
  } catch (error) {
    return { error }
  }
}