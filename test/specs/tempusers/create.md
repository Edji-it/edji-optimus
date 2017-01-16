# Edji Test Specs: Temp Users

## Goal

Users can get a temporary token to join projects

## Endpoint

`/tempusers`

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  user: {
    fullname: string,
    type?: string // defaults to 'temp', no other types currently supported
  }
}
```

## Response Data

Coming soon?

## Test Cases

1.  Pass good object
    *  `res` should have a:
        *  `status` = `201`
        *  `user`: `any` should have a:
            *  `_id`: `string`
            *  `fullname`: `string`
            *  `type`: `string`
            *  `timer`: `Date`
            *  `createdAt`: `Date`
            *  `updatedAt`: `Date`
        *  `token`: `string`
2.  Pass without `user` --> receive `400`
3.  Pass without `fullname`
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `fullname`: `string` = `required`
