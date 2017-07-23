# Edji Test Specs: Get Project

## Goal

User can retreive a project

## Endpoint

`/projects/:projectId` || `/projects/:projectCode`

## Available Query Parameters

`pop=reading_id`: allows population of the reading document straight onto the project

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with creating teacher's credentials and project id
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any`
    *  `res.project` should have a:
        *  `students_ids`: `string[]` should NOT contain the user's id

2.  Pass with students's credentials and project id
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
        *  `students_ids`: `string[]` should contain the user's id
        *  `comments`: `Comment[]` should:
            *  Be an array of objects
            *  Have comment data (not tested yet!)
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
3.  Pass with temp user's credentials and project id
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any`
    *  `res.project` should have a:
        *  `students_ids`: `string[]` should contain the user's id
4.  Pass with students's credentials and lowercase project code
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
        *  `comments`: `Comment[]` should have a:
            *  `replies`: `string[]`
            *  Check that at least one reply exists and that it is correct
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
5.  Pass with students's credentials and uppercase project code
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any`
6.  Pass with valid `id` and query string `pop=reading_id`
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any` should have a:
            *  `reading_id`: `any` should have an `_id` and `words`
7.  Pass with invalid project id --> receive `404`
8.  Pass with invalid project code --> receive `404`
9.  Pass without `Authorization` header
    *  `res` should have a:
        *  `status` = `200`
        *  `res.body.project` should be a `object`