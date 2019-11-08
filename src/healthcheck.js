// library imports
const router = require('express').Router()

// route handler
router.get('/healthcheck', (req, res) => {
  res.status(200).send({
    server_name: 'optimus-' + process.env.EDJI_STAGE,
    uptime: process.uptime(),
  })
})

module.exports = router
