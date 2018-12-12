// this could use more typing and probably re-writing in the future, but for now the front end relies heavily on these
//  error responses for objects which are validated heavily (readings, users, etc...)
export function cleanMongoValidationError(error: any): { [key: string]: string } {
  let errors = {}
  for (let property in error.errors) {
    if (error.errors[property].kind === "user defined") {
      errors[property] = error.errors[property].properties.kind
    } else {
      errors[property] = error.errors[property].kind
    }
  }

  return errors
}