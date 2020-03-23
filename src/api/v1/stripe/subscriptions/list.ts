// library imports
import { RequestHandler } from 'express'

// project imports
import { getHeroSubscriptions } from '../../../../services/stripe'

const ListSubscriptions: RequestHandler = async (req, res, next) => {
  const user = req.user

  if (!user.stripe_customer_id) {
    return res.status(200).send({ subscriptions: [] })
  }
  const customer_id = user.stripe_customer_id

  try {
    const subscriptions = await getHeroSubscriptions(customer_id, ['all'])
    return res.status(200).send({ subscriptions })
  } catch (err) {
    next(err)
  }
}

export default ListSubscriptions
