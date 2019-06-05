export class BadRequestError extends Error {
  status: number
  constructor(m: string, status: number) {
    super(m)
    this.status = status
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, Error.prototype)
  }
}
