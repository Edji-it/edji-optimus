import { Request, Response } from 'express'

export interface Request extends Request {
  user: any
}

export interface Response extends Response {

}