const helpers = require('./../_stripe')

module.exports = async function (req, res, next) {
  let customer_id = req.user.stripe_customer_id

  try {
    let subs = await helpers.getHeroSubscriptions(customer_id)
    return res.status(200).send({ subscriptions: subs })
  } catch (err) {
    next(err)
  }
}