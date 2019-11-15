// library imports
import { expect } from 'chai'
import { ImportMock } from 'ts-mock-imports'
import { RequestHandler, Request, Response, NextFunction } from 'express'

// project imports
import * as elastic from './../services/elasticsearch'
import Reading from './Reading'
import Project from './Project'
import ReadingVersion from './ReadingVersion'
import { deleteOwnerReading } from './_Reading'

// const mockHandler = (): Array<> => {
//   return
// }

// describe('_Reading', () => {
//   describe('deleteOwnerReading', () => {
//     it('should delete the reading from the database', async () => {
//       const handler = await deleteOwnerReading()(<Request>{}, <Response>{}, <NextFunction>{})
//     })
//   })
// })

// const elasticMock = ImportMock.mockClass(elastic, 'default')
