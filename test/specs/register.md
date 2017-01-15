# Edji Test Specs: Login

## Goal

Users can pass new user info and be returned that user's info with a json object

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  user: {
    username: string,
    password: string,
    fullname: string,
    email: string [regex],
    isTeacher?: boolean
  }
}
```

## Response Data

Coming soon?

## Test Cases

Note: Validation of this call without certain properties should be overlapped by tests for POST /users/login

1.  Pass good object
    *  `res` should have a:
        *  `user`: `any`
        *  `token`: `string`
2.  Pass invalid email, profane username and profane fullname
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `fullname`: `boolean` = `true`
            *  `username`: `boolean` = `true`
            *  `email`: `boolean` = `true`
3.  Pass duplicate username
    *  `res` should have a:
        *  `status` = `409`
        *  `errors`: `any` should have a `username`
4.  Pass without email --> receive `400`