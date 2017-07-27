const express = require('express')
const Middleware = require("./../middleware/Middleware")
const Q = require("q")

let router = express.Router()
var stripe = require("stripe")("sk_test_q0LZhd3CQZgkD0Q4ZVMf9n9d") // took out of try/catch because I want it to crash the server if it doesn't work

/**
 * Updates the user that we store in the database and prepares a user object to be sent out to the client
 * @param {User} user the user's mongoose doc from the database
 * @param {*} subscription subscription object from Stripe
 * @param {string} status 'subscribed' or 'unsubscribed'
 */
let updateUserSub = function(user, subscription, status) {
    return new Promise((resolve, reject) => {
        let customerId = subscription.customer
        let subscriptionType = subscription.plan.id
        if (!user.hero) {
            user.hero = {}
        }
        // Once customer is created we need to save customer_id
        if (!user.hero.customer_id) {
            user.hero.customer_id = customerId
        }

        // Update Hero properties on User
        // Remove expiration
        if (status == 'unsubscribed') {
            user.hero.will_expire = Date(subscription.current_period_end)
        }
        // Update Subscription ID
        user.hero.subscription_id = subscription.id
        // Update Subscription type
        user.hero.type = subscriptionType

        // Log subscription change
        user.hero.history.push({
            change: status,
            date: subscription.created,
            subscription_id: subscription.id,
            type: subscriptionType
        })

        user.hero.subscription_label = 'hero_launch_special'

        // we don't want to tell the user there was an error after charging them - if we don't end up with their stripe info, it's our fault
        // so prep the user object and resolve, then save after
        let resolveUser = user.toPublic()
        resolveUser.hero.active = true
        resolve(resolveUser)

        user.save((err, result) => {
            if (err) { console.error(err) }
        })
    })
}

/**
 * Creates and resolves with a new Stripe customer
 * @param {string} email the user's email
 * @param {string} paymentToken the payment token provided by Stripe's front end
 */
let createCustomer = function(email, paymentToken) {
    return new Promise((resolve, reject) => {
        stripe.customers.create({
            email: email,
            source: paymentToken
        }, function(err, customer) {
            if (err) {
                reject(err)
            } else {
                resolve(customer)
            }
        })
    })
}

/**
 * Create a coupon to be used for a single user during Edji Hero launch
 * @param {string} id the id of the coupon - should be the user's id
 * @param {number} amount_off value < 500 (it's in cents) which is subtracted from the user's payment each month
 */
let createCoupon = function(id, amount_off) {
    return new Promise((resolve, reject) => {
        stripe.coupons.create({
            id: "HERO_LAUNCH_" + id,
            duration: 'forever', // CODE REVIEW: I think that if the user cancels this subscription they'll no longer have the discount, yes?
            currency: 'USD',
            amount_off: Math.abs(amount_off)
        }, (err, coupon) => {
            if (err) {
                reject(err)
            } else {
                resolve(coupon)
            }
        })
    })
}

/**
 * Adds a customer to a subscription. This is effectively charging the customer
 * @param {string} customerId the user's Stripe customer id
 * @param {string} subscriptionType 'monthly', 'yearly', etc... I think this is an enum enforced by Stripe
 */
let subscribeCustomer = function(customerId, subscriptionType, coupon) {
    // Create Stripe subscription
    return new Promise((resolve, reject) => {
        stripe.subscriptions.create({
            customer: customerId,
            plan: subscriptionType,
            coupon: coupon
        }, (err, sub) => {
            if (err) { reject(err) }
            else { resolve(sub) }
        })
    })
}

/** Route to subscribe to Hero!!! */
router.post("/", Middleware.authRequired, function(req, res) {
        let user = req.user
        let paymentToken = req.body.token // Stripe encodes payment information into a token with the public key
        let subscriptionType = req.body.subscriptionType

        if (!paymentToken) {
            // This call requires a payment token
            return res.status(400).send({ error : "paymentToken is required" })
        }
        if (!subscriptionType) {
            return res.status(400).send({ error: "subscriptionType is required" })
        }

        // some people have a customer id and some don't yet, so we're promisifying this to avoid a nasty if statement
        let getCustomerId = Promise.resolve(user.hero && user.hero.customer_id)
            .then((customerId) => {
                if (customerId) {
                    // if they've got a customer id, straight up return it
                    return customerId
                } else {
                    // if they don't have a customer id, then create the customer and resolve with it's id
                    return createCustomer(user.emai, paymentToken)
                        .then((customer) => {
                            return customer.id // extract the customer id and pass to next stage of promise
                        })
                }
            })

        // kick off the promise chain, WOOT!
        getCustomerId.then((customerId) => {
            return createCoupon(user._id.toString(), 400)
                .then((coupon) => {
                    // I only used rawType here because Stripe's errors have it so it makes error handling less complex
                    if (!coupon) { throw { message: "No coupon code generated", rawType: "no_coupon_code" } }
                    // after getting the customer id and coupon, add the user to the Hero subscription
                    return subscribeCustomer(customerId, subscriptionType, coupon.id)
                })
        })
        .then((sub) => {
            // update the user object that we keep
            return updateUserSub(user, sub, 'subscribed')
        })
        .then((updatedUser) => {
            // send it back to the user and we're done!
            res.status(200).send({ user: updatedUser })
        })
        .catch((err) => {
            switch (err.rawType) {
                case 'invalid_request_error':
                    res.status(400).send({ error: err.message })
                    break
                case 'no_coupon_code':
                    res.status(500).send({ error: err.message })
                    break
                default:
                    console.error(err)
                    res.status(500).send()
            }
        })
    }
)


router.put("/", Middleware.authRequired, function(req, res) {
        /**
         * Two options:
         * - unsubscribe
         * - change subscription plan
         */
        let user = req.user
        let subscriptionId = user.hero.subscription_id
        let subscriptionType = req.body.subscription_type
        let statusChange = req.body.status

        let handleError = function(err) {
            console.error(err)
            res.status(500).send({ error: err }) // CODE REVIEW: DON'T RETURN THE ERROR TO THE CLIENT!!
        }

        let handleSuccess = function(sub) {
            updateUserSub(user, sub, statusChange)
            .then(value => {
                res.status(200).send({ user: user.toPublic(), subscription: sub })
            })
            .catch( err => {
                res.status(500).send({ error: 'Unable to save user object', subscription: sub })
            })
        }

        // If a Type is passed, we are changing plan
        if (subscriptionType) {
             stripe.subscriptions.update(
                subscriptionId,
                { plan: subscriptionType },
                function(err, subscription) {
                    // asynchronously called
                    updateUserSub(user, subscription)
                        .then(data => {
                            handleSuccess(subscription)
                        })
                        .catch((err) => {
                            handleError(err)
                        })
                }
            );
        } else if (statusChange == 'unsubscribed') {
            // Cancel subscription
            stripe.subscriptions.del(
                subscriptionId,
                function(err, confirmation) {
                    // asynchronously called
                    updateUserSub(user, subscription)
                        .then(data => {
                            handleSuccess(subscription)
                        })
                        .catch((err) => {
                            handleError(err)
                        })
                }
            );
        } else {
            // This request needs something more!
        }
       

    }
)


module.exports = router
