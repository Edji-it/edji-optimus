# Edji Test Specs: Get User

## Goal

Get the most current data on a user

## Endpoint

`/users/:userId`

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with user's id and a valid token
    - `res` should have a:
      - `status` = `200`
      - `user`: `any`
    - `res.user` should have a:
      - `user` should have a:
        - `_id`: `string`
        - `username`: `string`
        - `fullname`: `string`
        - `email`: `string`
        - `createdAt`: `Date`
        - `updatedAt`: `Date`
      - `user` should NOT have a:
        - `password`
        - `resetPasswordToken`
        - `resetPasswordExpires`
        - `accountArchiveToken`
2.  Pass with invalid id --> receive `400`
3.  Pass with id that does not exist --> receive `401`
4.  Pass without `Authorization` header --> receive `401`
5.  Pass with token that does not match the user --> receive `401`
