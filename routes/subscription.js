const express = require('express')
const Middleware = require("./../middleware/Middleware")
const Q = require("q")

let router = express.Router()

try {
    var stripe = require("stripe")("sk_test_q0LZhd3CQZgkD0Q4ZVMf9n9d");
} catch (error) {
    console.log(error.message);
}

let subscribeCustomer = function(customerId, subscriptionType) {
    // Create Stripe subscription
    console.log("getting subscription")
    return new Promise((resolve, reject) => {
        console.log(
            {
            customer: customerId,
            plan: subscriptionType,
        }
        )
        stripe.subscriptions.create({
            customer: customerId,
            plan: subscriptionType,
        }, (err, sub) => {
            console.log("got a response")
            if (err) { reject(err) }
            else { resolve(sub) }
        })
    })

    // , function(err, subscription) {
        // asynchronously called
        // console.log(subscription)
        // return subscription

        // // Update Hero properties on User
        // // Change status
        // user.hero.status = 
        // // Push Update object
        // user.hero.updates.push({
        //     change: 'subscribed',
        //     date: 
        //     subscriptionId: 
        // })
        // // Update Subscription type
        // user.type = subscriptionType

        // Once customer is created we need to save customer_id
        // user.hero.customer_id = customer.id



        // user.save(false, (err, result) => {
        //     console.log(result)
        // })
    // });
}

router.post("/", Middleware.authRequired, function(req, res) {
        let user = req.user
        let customerId = user.hero && user.hero.customer_id
        // Stripe encodes payment information into a token with the public key
        let paymentToken = req.body.token
        let subscriptionType = req.body.subscriptionType

        let handleError = function(err) {
            console.error(err)
            res.status(500).send({ error: err }) // CODE REVIEW: DON'T RETURN THE ERROR TO THE CLIENT!!
        }

        let handleSuccess = function(sub) {
            res.status(200).send({ subscription: sub })
        }

        // Does user exist as customer?
        if (!customerId) {
            // Create customer 
            var customer = stripe.customers.create({
                email: user.email,
                source: paymentToken
            }, function(err, customer) {
                // Now we have a customer id, we can create a subscription
                subscribeCustomer(customer.id, subscriptionType)
                    .then((sub) => {
                        handleSuccess(sub)
                    })
                    .catch((err) => {
                        handleError(err)
                    })
            });
        } else {
            // return subscribeCustomer(customerId, subscriptionType)
            subscribeCustomer(customerId, subscriptionType)
                .then((sub) => {
                    handleSuccess(sub)
                })
                .catch((err) => {
                    handleError(err)
                })
        }

        

        /**
         * We either need user to have:
         * - Saved payment method
         * - Submitted payment information with this request
         */

        // Create Stripe subscription
        stripe.subscriptions.create({
            customer: customer.id,
            plan: "basic-monthly",
        }, function(err, subscription) {
            // asynchronously called
        });


    }
)

module.exports = router
