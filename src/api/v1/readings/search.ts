// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import { validateSearchQuery, constructSearch, searchByIds } from './_search'
import { search } from '../../../services/elasticsearch'

export default async function SearchController(req: Request, res: Response, next: NextFunction) {
  const userId = req.context.user && req.context.user._id
  const { error, value: query, status } = validateSearchQuery(req.query, req.context.user)
  if (error) {
    return res.status(status || 400).send({ error })
  }

  try {
    const searchParams = constructSearch(query, userId)
    const { hits, buckets, total } = await search(searchParams)
    const results = await searchByIds(
      hits.hits.map(hit => hit._id),
      query.pop,
    )
    const body: any = {
      total,
      returned: results.length,
      buckets,
      results,
    }
    if (query.debug) {
      body.debug = searchParams.body
    }
    return res.status(200).send(body)
  } catch (err) {
    return next(err)
  }
}
