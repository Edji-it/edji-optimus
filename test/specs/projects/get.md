# Edji Test Specs: Login

## Goal

Users can store a project

## Endpoint

`/projects/:projectId`

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with creating teacher's credentials
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any`
    *  `res.project` should have a:
        *  `_id`: `string`
        *  `teacher_id`: `string`
        *  `reading_id`: `string`
        *  `label`: `string`
        *  `code`: `string`
        *  `types`: `string[]`
        *  `temp_ids`: `string[]`
        *  `students_ids`: `string[]`
        *  `comments`: `Comment[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
2.  Pass without `Authorization` header --> receive `401`