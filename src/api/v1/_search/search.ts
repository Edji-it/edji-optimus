import { Request, Response, NextFunction } from "express"

import elastic from '../../../elasticsearch'

export async function SearchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    let results = await elastic.search({
      index: req.params.index,
      type: 'default', // types are being removed in elasticsearch so all of our types will be default
      body: req.body
    })
    res.status(200).send(results.hits)
  } catch (err) {
    return next(err)
  }
}