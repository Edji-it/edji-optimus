/** Provides middleware for everything except login */

var middleware = {
  
  /** Sends user a 401 if unauthorized to access endpoint */
  authRequired: function(req, res, next) {
    if (!req.user) {
      res.status(401).send()
      next("unauthorized")
    } else {
      next()
    }
  },
  headerManagement: function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*')
    var oneof = false
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        res.header('Access-Control-Allow-Credentials', true)
        oneof = true
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
        oneof = true
    }

    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        oneof = true
    } 
    // else {
    //     // Request headers you wish to allow
    //     res.header('Access-Control-Allow-Headers', 'authorization, content-type, accept, origin')
    // }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true)

    // Pass to next layer of middleware
    next()
  }
}

module.exports = middleware