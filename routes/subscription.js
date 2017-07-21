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
}

let updateUserSub = function(user, subscription) {
    // Once customer is created we need to save customer_id
    if (!user.hero.customer_id) {
        user.hero.customer_id = customer.id
    }
    
    // Update Hero properties on User
    // Change status
    user.hero.status = 'subscribed'
    // Update Subscription type
    user.type = subscriptionType

    // Log subscription change
    user.hero.history.push({
        change: 'subscribed',
        date: subscription.created,
        subscriptionId: subscription.id,
        type: subscriptionType
    })

    user.save(false, (err, result) => {
        console.log(result)
    })
}

router.post("/", Middleware.authRequired, function(req, res) {
        let user = req.user
        let customerId = user.hero && user.hero.customer_id
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
            updateUserSub(user, sub)
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
