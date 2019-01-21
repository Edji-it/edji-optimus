export interface SaveAndIndexOptions {
  save: Promise<any>
  index?: Promise<any>
}
interface SaveAndIndexResults {
  saveResults: any
  indexResults?: any
}

export async function executeSaveAndIndex({ save, index }: SaveAndIndexOptions): Promise<SaveAndIndexResults> {
  let queue: Array<Promise<any>> = []
  queue.push(save)
  index && queue.push(index)

  let results = await Promise.all(queue)
  return {
    saveResults: results[0],
    indexResults: results[1] // can be undefined so watch out!
  }
  // index && console.log(results[1])
  // return results[0]
}

let wrapMongooseUpdate = ({ query, update, mongooseOptions }) => {
  try {
    return this.findOneAndUpdate(query, update, mongooseOptions)
  } catch (error) {
    return { error }
  }
}

let wrapMongooseSave = () => {
  try {
    return this.save()
  } catch (error) {
    return { error }
  }
}