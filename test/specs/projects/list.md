# Edji Test Specs: Get Projects

## Goal

Get all of a user's projects

## Endpoint

`/projects`

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with `Authorization` header
    *  `res` should have `status` = `200`
    *  `res` should have `projects`
    *  `res.projects` should be an `array`
    *  `res.projects[0]` should have a:
        *  `_id`: `string`
        *  `teacher_id`: `string`
        *  `reading_id`: `string`
        *  `label`: `string`
        *  `code`: `string`
        *  `types`: `string[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
    *  `res.readings[0]` should NOT have:
        *  `comments`: `Comment[]`
        *  `students_ids`: `string[]`
        *  `temp_ids`: `string[]`
2.  Pass without `Authorization` header
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `user`: `string` = `required`