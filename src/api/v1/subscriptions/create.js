

// project imports
const helpers = require('./_create')

module.exports = function(req, res) {
  let user = req.user
  const body = helpers.validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  // // some people have a customer id and some don't yet, so we're promisifying this to avoid a nasty if statement
  // let getCustomerId = Promise.resolve(user.hero && user.hero.customer_id)
  // .then((customerId) => {
  //     if (customerId) {
  //         // if they've got a customer id, straight up return it
  //         return customerId
  //     } else {
  //         // if they don't have a customer id, then create the customer and resolve with it's id
  //         return createCustomer(user.email, paymentToken)
  //             .then((customer) => {
  //                 return customer.id // extract the customer id and pass to next stage of promise
  //             })
  //     }
  // })

  return res.status(200).send()
}