import { RequestHandler } from 'express'

export const sendResponse = ({ status }: { status?: number } = {}): RequestHandler => {
  return (req, res) => {
    const { body } = res
    res.status(status || res.statusCode).send(body || {})
  }
}
