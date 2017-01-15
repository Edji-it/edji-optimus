# Edji Test Specs: Login

## Goal

Users can pass credentials and be returned a Json Web Token, which allows them access to other parts of the site

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  user: {
    username: string
    password: string
  }
}
```

## Response Data

The response will contain the following in json form

```javascript

user: {
  username: string,
  fullname: string,
  ...
},
token: string

```

## Test Cases

1.  Pass correct `username` and `password` --> receive response
    *  `res` should have a:
        *  `user`: `any`
            *  `user` should have a:
                *  `_id`: `string`
                *  `username`: `string`
                *  `fullname`: `string`
                *  `email`: `string`
                *  `isTeacher`: `boolean`
                *  `createdAt`: `Date`
                *  `updatedAt`: `Date`
            *  `user` should NOT have a:
                *  `password`
                *  `resetPasswordToken`
                *  `resetPasswordExpires`
                *  `accountArchiveToken`
        *  `token`: `string`
2.  Pass correct `username`, with mix of upper and lowercase letters, and correct `password`
3.  Pass incorrect `username` --> receive `404`
4.  Pass incorrect `password` --> receive `404`
5.  Pass without `user` --> receive `400`
6.  Pass without `username` --> receive `400`
7.  Pass without `password` --> receive `400`