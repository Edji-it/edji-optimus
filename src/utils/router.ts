import {Router, RouterOptions} from 'express'

const edjiRouter = function(options: RouterOptions): Router {
  const router = Router(options)
  router['expressUse'] =  router.use
  router.use = (...args) => {
    console.log('got args', args)
    return router['expressUse'](...args)
  }
  // delete router['expressUse']
  // router.use = expressUse
  return router
}

export default edjiRouter