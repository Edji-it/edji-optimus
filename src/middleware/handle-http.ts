import { RequestHandler } from 'express'

export const sendResponse = ({ status }: { status?: number } = {}): RequestHandler => {
  return (req, res) => {
    const { body } = res
    res.status(status || 200).send(body)
  }
}
