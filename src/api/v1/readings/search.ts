// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import { validateSearchQuery, constructSearch, searchByIds } from './_search'

export default async function SearchController(req: Request, res: Response, next: NextFunction) {
  const { error, value: query } = validateSearchQuery(req.query)
  if (error) {
    return res.status(400).send({ error })
  }

  try {
    const { hits } = await constructSearch(query)
    const results = await searchByIds(hits.hits.map(hit => hit._id))
    let body = {
      total: hits.total,
      returned: results.length,
      results
    }
    return res.status(200).send(body)
  } catch (err) {
    return next(err)
  }
}