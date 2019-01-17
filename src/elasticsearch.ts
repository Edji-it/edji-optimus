import { Client } from 'elasticsearch'

let client = new Client({
  host: process.env.EDJI_QUICKSHADOW_DOMAIN
})

export default client