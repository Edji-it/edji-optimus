# Edji Test Specs: Create Subscription

## Goal

Users can store a reading

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  token: string,
  subscriptionType: string,
  couponCode?: string
}
```

`token` corresponds to the user's payment in Stripe. It gets passed to Stripe.
`subscriptionType` is the plan (in Stripe) the user is subscribing to
`couponCode` (optional) is the code for the Stripe coupon

## Response Data

```javascript
res: {
  user: User
}
```

## Test Cases

1.  Pass with `subscriptionType` = `monthly`, `token` = `tok_visa` and no coupon code, and a user who's never signed up before
    *  `res` should have:
        *  `user.hero` should have:
            *  `active` = `true`
            *  `subscription_type` =  `monthly`
            *  `subscription_label` = `PLAIN_HERO`
            *  `subscription_id`: `string`
            *  `history`:
                *  should be an array of:
                    *  `subscription_id`: `string`
                    *  `subscription_type`: `string`
                    *  `change`: `string`
                    *  `date`: `Date`
                *  `history[0]` should have:
                    *  `subscription_id` = `res.user.hero.subscription_id`
                    *  `subscription_type` = `monthly`
                    *  `change` = `subscribed`
                    *  `date` > `Date.now() - 1000 * 60`
        *  `user.hero` should NOT have:
            *  `will_expire`: `Date`
2.  Pass with `subscriptionType` = `monthly`, `token` = `tok_visa`, `couponCode` = `TEST__2017` and no coupon code, and a user who's never signed up before
    *  `res` should have:
        *  `user.hero` should have:
            *  `active` = `true`
            *  `subscription_type` =  `monthly`
            *  `subscription_label` = `TEST`
            *  `subscription_id`: `string`
        *  `user.hero` should NOT have:
            *  `will_expire`: `Date`
3.  Pass without `subscriptionType` --> receive `400`
4.  Pass without `token` --> receive `400`
5.  Pass without `Authorization` header --> receive `401`