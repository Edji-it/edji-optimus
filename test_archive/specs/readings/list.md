# Edji Test Specs: Get Readings

## Goal

Get all of a user's readings

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with `Authorization` header
    - `res` should have `status` = `200`
    - `res` should have `readings`
    - `res.readings` should be an `array`
    - `res.readings[0]` should have a:
      - `_id`: `string`
      - `owner_id`: `string` should be equal to the reading creator's id
      - `title`: `string`
      - `promoter_ids`: `string[]`
      - `teacher_ids`: `string[]`
      - `updatedAt`: `Date`
      - `createdAt`: `Date`
    - `res.readings[0]` should NOT have:
      - `words`: `any[]`
      - `html`: `string`
      - `comments`: `Comment[]`
2.  Pass without `Authorization` header --> receive `401`
