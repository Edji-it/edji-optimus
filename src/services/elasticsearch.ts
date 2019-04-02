import { Client, DeleteDocumentResponse } from 'elasticsearch'

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
