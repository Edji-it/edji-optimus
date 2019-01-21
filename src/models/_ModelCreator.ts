export async function executeSaveAndIndex(save: Promise<any>, index?: Promise<any>) {
  let queue: Array<Promise<any>> = []
  queue.push(save)
  index && queue.push(index)

  let results = await Promise.all(queue)
  return results[0]
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