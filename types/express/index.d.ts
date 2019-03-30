
// this is called namespace merging: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
//  it lets us declare extra properties on the Request interface by merging what we write here
//  with Express's Request interface
declare namespace Express {
  export interface Request {
    user?: any
    path_matcher: string
    context: {
      user?: any
      routeName?: string
      [key: string]: any
    }
    oauth_error: any
  }
  export interface Errback {
    type?: string
    code?: string
  }
}