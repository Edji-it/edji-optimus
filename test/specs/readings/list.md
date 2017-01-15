# Edji Test Specs: Login

## Goal

Get all of a user's readings

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with `Authorization` header
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings` should be an `array`
    *  `res.readings[0]` should have a:
        *  `_id`: `string`
        *  `owner_id`: `string`
        *  `title`: `string`
        *  `promoter_ids`: `string[]`
        *  `teacher_ids`: `string[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
4.  Pass without `Authorization` header --> receive `401`