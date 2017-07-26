const express = require('express')
const Middleware = require("./../middleware/Middleware")
const Q = require("q")

let router = express.Router()
var stripe = require("stripe")("sk_test_q0LZhd3CQZgkD0Q4ZVMf9n9d") // took out of try/catch because I want it to crash the server if it doesn't work

let subscribeCustomer = function(customerId, subscriptionType) {
    // Create Stripe subscription
    return new Promise((resolve, reject) => {
        stripe.subscriptions.create({
            customer: customerId,
            plan: subscriptionType,
        }, (err, sub) => {
            if (err) { reject(err) }
            else { resolve(sub) }
        })
    })
}

/**
 * 
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

        user.save( (err, result) => {
            if (result) {
                resolve(result)
            } else {
                reject(err)
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
            id: id,
            duration: 'forever',
            currency: 'USD',
            amount_off: amount_off
        }, (err, coupon) => {
            if (err) {
                reject(err)
            } else {
                resolve(coupon)
            }
        })
    })
}

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

router.get("/coupons", Middleware.authRequired, (req, res) => {
    let user = req.user
    createCoupon(user._id.toString(), 4)
        .then((coupon) => {
            res.status(200).send({ coupon: coupon })
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send({ error: err })
        })
})

router.post("/", Middleware.authRequired, function(req, res) {
        let user = req.user
        // let customerId = user.hero && user.hero.customer_id
        // Stripe encodes payment information into a token with the public key
        let paymentToken = req.body.token
        let subscriptionType = req.body.subscriptionType

        if (!paymentToken) {
            // This call requires a payment token
            res.status(400).send({ error : "paymentToken is required" })
        }

        let handleError = function(err) {
            console.error(err)
            res.status(500).send({ error: err }) // CODE REVIEW: DON'T RETURN THE ERROR TO THE CLIENT!!
        }

        let handleSuccess = function(sub) {
            updateUserSub(user, sub, 'subscribed')
                .then(value => {
                    res.status(200).send({ user: user.toPublic(), subscription: sub })
                })
                .catch( err => {
                    res.status(500).send({ error: 'Unable to save user object', subscription: sub })
                })
        }

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

        getCustomerId.then((customerId) => {
            // return subscribeCustomer(customerId, subscriptionType)
            return subscribeCustomer(customerId, subscriptionType)
        })
        .then((sub) => {
            handleSuccess(sub)
        })
        .catch((err) => {
            handleError(err)
        })


        // Does user exist as customer?
        // if (!customerId) {
        //     // // Create customer 
        //     // var customer = stripe.customers.create({
        //     //     email: user.email,
        //     //     source: paymentToken
        //     // }, function(err, customer) {
        //     //     if (customer) {
        //     //         // Now we have a customer id, we can create a subscription
        //     //         subscribeCustomer(customer.id, subscriptionType)
        //     //             .then((sub) => {
        //     //                 handleSuccess(sub)
        //     //             })
        //     //             .catch((err) => {
        //     //                 handleError(err)
        //     //             })
        //     //     } else {
        //     //         res.status(500).send({ error: err }) 
        //     //     }
        //     // });
        //     createCustomer(user.email, paymentToken)
        //         .then((customer) => {
        //             return subscribeCustomer(customer.id, subscriptionType)
        //         })
        //         .then((sub) => {
        //             handleSuccess(sub)
        //         })
        //         .catch((err) => {
        //             handleError(err)
        //         })
        //         .catch((err) => {

        //         })
        // } else {
        //     // return subscribeCustomer(customerId, subscriptionType)
        //     subscribeCustomer(customerId, subscriptionType)
        //         .then((sub) => {
        //             handleSuccess(sub)
        //         })
        //         .catch((err) => {
        //             handleError(err)
        //         })
        // }
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
