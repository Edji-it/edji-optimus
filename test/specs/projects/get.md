# Edji Test Specs: Get Project

## Goal

Users can store a project

## Endpoint

`/projects/:projectId` || `/projects/:projectCode`

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
        *  `students_ids`: `string[]` should:
            *  Be an array of objects
            *  NOT contain an object of form `{ _id: teachersId, fullname: teachersFullname }`

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
        *  `students_ids`: `string[]` should:
            *  Be an array of objects
            *  Contain an object of form `{ _id: studentId, fullname: studentFullName }`
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
        *  Be an array of objects
        *  NOT contain an object of form `{ _id: teachersId, fullname: teachersFullname }`
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
        *  `comments`: `Comment[]`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
5.  Pass with students's credentials and uppercase project code
    *  `res` should have a:
        *  `status` = `200`
        *  `project`: `any`
6.  Pass with invalid project id --> receive empty object
7.  Pass with invalid project code --> receive empty object
8.  Pass without `Authorization` header --> receive `401`