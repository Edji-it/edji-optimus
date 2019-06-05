import { Client, DeleteDocumentResponse, SearchParams, SearchResponse } from 'elasticsearch'

let client = new Client({
  host: process.env.EDJI_QUICKSHADOW_DOMAIN,
})

export default client

export const deleteOne = ({ index, id }: { index: string; id: string }): Promise<DeleteDocumentResponse> => {
  return client.delete({
    index,
    type: 'default',
    id,
  })
}

export const search = (params: SearchParams): Promise<EdjiSearchResponse> => {
  return client.search(params).then(formatSearchResults)
}

export const formatSearchResults = ({ hits, aggregations }: SearchResponse<any>): EdjiSearchResponse => {
  let buckets = {}
  for (let key in aggregations) {
    buckets[key] = aggregations[key].buckets
  }
  return { hits, buckets, total: hits.total }
  // let body = {
  //   total: hits.total,
  //   returned: results.length,
  //   aggregations,
  //   results,
  // }
}

interface EdjiSearchResponse {
  hits: any
  buckets: {
    [key: string]: Array<{
      key: string
      doc_count: number
    }>
  }
  total: number
}
