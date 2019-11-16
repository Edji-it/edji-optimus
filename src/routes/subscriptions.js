const express = require('express')
const authRequired = require('./../middleware/auth-required')

let router = express.Router()

const STRIPE_KEY = process.env.STRIPE_API_TOKEN
let stripe = require('stripe')(STRIPE_KEY) // took out of try/catch because I want it to crash the server if it doesn't work
const FULL_PRICE = 6000 // in cents this is $60

/**
 * Looks up a Stripe coupon and returns it
 * @param {string} couponId The id of the coupon
 */
let getCoupon = function(couponId) {
  return new Promise((resolve, reject) => {
    stripe.coupons.retrieve(couponId, function(err, coupon) {
      if (err) {
        reject(err)
      } else {
        resolve(coupon)
      }
    })
  })
}

// find and validate a coupon code submitted by a user
router.get('/coupons/:coupon_id', authRequired, (req, res, next) => {
  let couponId = req.params.coupon_id
  if (!couponId) {
    return res.status(400).send({ error: 'no coupon id supplied' })
  }

  getCoupon(couponId)
    .then(coupon => {
      if (coupon.amount_off != null && coupon.percent_off == null) {
        let percentOff = Math.round(((FULL_PRICE - coupon.amount_off) * 100) / FULL_PRICE)
        return res.status(200).send({ status: 'coupon_found', percent_off: percentOff })
      } else {
        return res.status(200).send({ status: 'coupon_found', percent_off: coupon.percent_off })
      }
    })
    .catch(err => {
      switch (err.statusCode) {
        case 404:
          res.status(404).send({ error: 'coupon not found' })
          break
        default:
          next(err)
      }
    })
})

module.exports = router
