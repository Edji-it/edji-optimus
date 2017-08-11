const express = require('express')
const Middleware = require("./../middleware/Middleware")
const Q = require("q")
const config = require("config")

let User = require("./../models/User")

let router = express.Router()

const STRIPE_KEY = process.env.STRIPE_API_TOKEN || config.get('STRIPE_API.TOKEN')
let stripe = require("stripe")(STRIPE_KEY) // took out of try/catch because I want it to crash the server if it doesn't work

/**
 * Updates the user that we store in the database and prepares a user object to be sent out to the client
 * @param {User} user the user's mongoose doc from the database
 * @param {*} subscription subscription object from Stripe
 * @param {boolean} subscribed determines whether or not to set will_expire on the user - true means they subscribed
 */
let updateUserSub = function(user, subscription, subscribed) {
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

        // // Update Hero properties on User
        // // Remove expiration
        if (!subscribed) {
            user.hero.will_expire = Date(subscription.current_period_end)
        } else {
            user.hero.will_expire = null
        }

        // Update Subscription ID
        user.hero.subscription_id = subscription.id
        // Update Subscription type
        user.hero.subscription_type = subscriptionType
        
        // get the coupon id, if it exists
        let couponId = subscription.discount && subscription.discount.coupon && subscription.discount.coupon.id
        if (couponId) {
            let subLabel = couponId.substr(0, couponId.indexOf("__")) // this extracts everything before the double underscore in the id
            user.hero.subscription_label = subLabel
        } else {
            user.hero.subscription_label = "PLAIN_HERO"
        }

        // Log subscription change
        user.hero.history.unshift({
            change: subscribed ? "subscribed" : "unsubscribed",
            date: Date(subscription.created),
            subscription_id: subscription.id,
            subscription_type: subscriptionType
        })

        user.save((err, result) => {
            if (err) {
                console.error(err)
            }
        })

        // we don't want to tell the user there was an error after charging them - if we don't end up with their stripe info, it's our fault
        // so prep the user object and resolve, then save after
        let resolveUser = user.toPublic()
        resolveUser.hero.active = true
        resolve(resolveUser)
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
let createCoupon = function(coupon_id, amount_off) {
    return new Promise((resolve, reject) => {
        stripe.coupons.create({
            id: coupon_id,
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
 * @param {string} coupon the id for the coupon you are adding to the subscription
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

/**
 * Update a Stripe subscription and resolve with that subscription
 * @param {string} subscriptionId the subscription's id
 * @param {*} update an object containing the property to update and the updated values
 */
let updateSubscription = function(subscriptionId, update) {
    return new Promise((resolve, reject) => {
        stripe.subscriptions.update(
            update,
            { plan: subscriptionType },
            function(err, subscription) {
                if (err) { reject(err) }
                else { resolve(subscription) }
            }
        )
    })
}

/**
 * Cancel's a user's subscription through Stripe
 * @param {string} subscriptionId the id for the subscription to delete
 */
let cancelSubscription = function(subscriptionId) {
    return new Promise((resolve, reject) => {
        stripe.subscriptions.del(
            subscriptionId,
            function(err, sub) {
                if (err) { reject(err) }
                else { resolve(sub) }
            }
        )
    })
}

// all of the math here is done in cents
const fullPrice = 6000
const startingPrice = 100
const priceIncrement = 3

let calculateAmountOff = function() {
    return Q(User.count({ "hero.subscription_label": "HERO_LAUNCH" }).exec())
        .then((count) => {
            let startingAmountOff = fullPrice - startingPrice
            let currentAmountOff = startingAmountOff - count * priceIncrement
            return currentAmountOff
        })
}

/** Route to subscribe to Hero!!! */
router.post("/", Middleware.authRequired, function(req, res) {
    let user = req.user
    let paymentToken = req.body.token // Stripe encodes payment information into a token with the public key
    let subscriptionType = req.body.subscriptionType
    let couponCode = req.body.couponCode

    if (!paymentToken) {
        // This call requires a payment token
        return res.status(400).send({ error : "paymentToken is required" })
    }
    if (!subscriptionType) {
        return res.status(400).send({ error: "subscriptionType is required" })
    }

    // array of promises to be executed by Q
    let promises = []

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

    promises.push(getCustomerId, calculateAmountOff())

    // kick off the promise chain, WOOT!
    Q.all(promises).then((results) => {
        let customerId = results[0]
        let amountOff = results[1]

        if (couponCode === 'HERO_LAUNCH') {
            return createCoupon(couponCode + "__" + user._id.toString(), amountOff)
                .then((coupon) => {
                    // I only used rawType here because Stripe's errors have it so it makes error handling less complex
                    if (!coupon) { throw { message: "No coupon code generated", rawType: "no_coupon_code" } }
                    // after getting the customer id and coupon, add the user to the Hero subscription
                    return subscribeCustomer(customerId, subscriptionType, coupon.id)
                })
        } else { // we skip out on creating the coupon if the customer already gave us a coupon code
            return subscribeCustomer(customerId, subscriptionType, couponCode)
        }
    })
    .then((sub) => {
        // update the user object that we keep
        return updateUserSub(user, sub, true)
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
})


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
            res.status(500).send({ })
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
            )
        } else if (statusChange == 'unsubscribed') {
            // Cancel subscription
            stripe.subscriptions.del(
                subscriptionId,
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
            )
        } else {
            // This request needs something more!
        }
       

    }
)

router.delete("/:subscription_id", Middleware.authRequired, (req, res) => {
    let user = req.user
    let subscription_id = req.params.subscription_id
    let history = user.hero && user.hero.history

    if (!subscription_id) {
        return res.status(400).send({ error: "subscription id required" })
    } else if (!history || history.length < 1) { // this would mean the user doesn't have that subscription in their history
        return res.status(404).send()
    }

    let subEvent = history.find((event) => {
        return event.subscription_id === subscription_id
    })

    if (!subEvent) { return res.status(404).send({ error: "user has no such subscription event" }) }

    // cancel the subscription with Stripe
    cancelSubscription(subscription_id)
        .then((sub) => {
            // update the user and save
            return updateUserSub(user, sub, false)
        })
        .then((updatedUser) => {
            // send it back to the user and we're done!
            res.status(200).send({ user: updatedUser })
        })
        .catch((err) => {
            switch (err.rawType) {
                case 'invalid_request_error': //  this is the error Stripe will throw with 400s
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
})

// gets the current cost of the coupon
router.get("/coupons/:coupon_id", (req, res) => {
    let couponId = req.params.coupon_id
    if (!couponId === 'HERO_LAUNCH') {
        return res.status(404).send({ error: "coupon code not found" })
    }

    calculateAmountOff().then((amountOff) => {
        return res.status(200).send({ cost: fullPrice - amountOff })
    })
    .catch((err) => {
        console.error(err)
        return res.status(500).send()
    })
})


module.exports = router
