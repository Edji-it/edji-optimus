# Edji Test Specs: Get Versions for Reading

## Goal

User can retreive lightweight info for all of the versions under a version_id

## Endpoint

`/readings/versions/:version_id`

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with creating teacher's credentials and version id
    *  `res` should have a:
        *  `status` = `200`
        *  `readings`: `any[]`
    *  `res.readings` should be an array of objects, shaped like:
        *  `_id`: `string`
        *  `title`: `string`
        *  `owner_id`: `string`
        *  `teacher_ids`: `string[]`
        *  `source`: `string`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
    *  `res.readings` objects should NOT contain:
        *  `html`: `string`
        *  `words`: `any[]`
        *  some other stuff
2.  Pass with invalid version id --> receive `400`
3.  Pass with version id that doesn't exist --> receive `404`
4.  Pass without `Authorization` header --> receive `401`
5.  Pass with `Authorization` token that does not belong to the owner --> receive `401`