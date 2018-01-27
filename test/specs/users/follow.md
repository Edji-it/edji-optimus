# Edji Test Specs: Follow and Unfollow a User

## Goal

Provide an endpoint which will add a user's id to a requestor's `following` array

## Request Type

`PUT`

## Route

Needs Authorization token

`/users/followers`

## Expected Parameters

*  `action` is expected to be a property in the request's body, and can have the value `follow` or `unfollow`
*  `user_id` the user's id which will be either added or removed from the `following` array

## Testing

### Setup

Call the endpoint with a user's id and the `unfollow` action, to ensure that the user is not followed at the beginning of testing

### Cases

1.  Call with valid Authorization header, a valid `user_id` and `follow` action
    *  `res` should have a:
        *  `status` = `200`
        *  `user` is an Object with:
            *  `following: string[]` has submitted `user_id` in the array
3.  Call with same Authorization header, the same `user_id` and the `follow` action (again)
    *  `res` should have a:
        *  `status` = `400`
        *  `error: string` (a message saying the user has already been followed)
        *  `action: string` = `follow`
3.  Call with same Authorization header, the same `user_id` and the `unfollow` action
    *  `res` should have a:
        *  `status` = `200`
        *  `user` is an Object with:
            *  `following: string[]` has submitted `user_id` in the array
4.  Call with same Authorization header, the same `user_id` and the `unfollow` action (again)
    *  `res` should have a:
        *  `status` = `400`
        *  `error: string` (a message saying the user has already been followed)
        *  `action: string` = `unfollow`
5.  Call without Authorization header => receive `404`
6.  Call `user_id` that is not a valid Mongo id => receive `400`
7.  Call with `user_id` equal to the user's own `_id` => receive `400`
8.  Call without an `action` => receive `400`
9.  Call without a `user_id` => receive `400`