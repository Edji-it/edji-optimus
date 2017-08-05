# Edji Test Specs: Delete Subscription

## Goal

Let a user delete his/her Stripe subscription

## Endpoint

`/subscriptions/:subscription_id`

## Request Type

`DELETE`

## Returns
`200` with updated `user` object

## Test Cases

1.  Pass with `Authorization` header and legit `subscription_id`
    *  `res` should have:
        *  `status` = `200`
        *  `user`: `any`
        *  `user.hero` should have:
            *  `active` = `true`
            *  `subscription_type`: `string`
            *  `subscription_label`: `string`
            *  `subscription_id`: `string`
            *  `will_expire`: `Date`
            *  `history`:
                *  `history[0]` should have:
                    *  `subscription_id` = `res.user.hero.subscription_id`
                    *  `subscription_type`: `string`
                    *  `change` = `unsubscribed`
                    *  `date` > `Date.now() - 1000 * 60`
4.  Pass with `Authorization` header and invalid `subscription_id` --> receive `400`
5.  Pass with `Authorization` and non-existant `subscription_id` --> receive `404`
6.  Pass with `Authorization` header that has a different user's token --> receive `404`
7.  Pass without `Authorization` header --> receive `401`