// library imports
import { RequestHandler } from 'express'

// project imports
import { getHeroSubscriptions } from './../_stripe'

const ListSubscriptions: RequestHandler = async (req, res, next) => {
  let customer_id = req.user.stripe_customer_id

  if (!customer_id) {
    return res.status(200).send({ subscriptions: [] })
  }

  try {
    const subscriptions = await getHeroSubscriptions(customer_id, 'all')
    return res.status(200).send({ subscriptions })
  } catch (err) {
    next(err)
  }
}

export default ListSubscriptions
