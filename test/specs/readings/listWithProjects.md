# Edji Test Specs: Get Readings with Projects

## Goal

Get all of a user's readings, along with projects nested under the readings

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with `Authorization` header
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings` should be an `array`
    *  each reading should have a:
        *  `_id`: `string`
        *  `owner_id`: `string` should be equal to the reading creator's id
        *  `title`: `string`
        *  `promoter_count` = SUM(`promoter_ids`): `number`
        *  `keeper_ids`: `string[]`
        *  `public`: `boolean`
        *  `source`: `string`
        *  `projects`: `any[]`
        *  `cover_img`: `string`
        *  `createdAt`: `Date`
        *  `updatedAt`: `Date`
        *  Each project should have
            *  `_id`: `string`
            *  `teacher_id`: `string`
            *  `comment_count` = SUM(`comments`): `number`
            *  `students_count` = SUM(`students_ids`) + SUM(`temp_ids`): `number`
            *  `label`: `string`
            *  `code`: `string`
            *  `types`: `string[]`
            *  `createdAt`: `Date`
            *  `updatedAt`: `Date`
        *  Each project should NOT have
            *  `comments`: `any[]`
            *  `students_ids`: `string[]`
            *  `temp_ids`: `string[]`
    *  Each reading should NOT have:
        *  `words`: `any[]`
        *  `html`: `string`
        *  `comments`: `Comment[]`
2.  Pass without `Authorization` header --> receive `401`