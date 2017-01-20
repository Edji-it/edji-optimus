# Edji Test Specs: Get Projects by Reading Id

## Goal

Users can get all of the projects for a single reading

## Endpoint

`/projects/:project_id/reading/:reading_id`

## Request Type

`GET`

## Response Data

Coming soon?

## Test Cases

1.  Pass with owner's credentials, valid project and existing reading id
    *  `res` should have a:
        *  `status` = `200`
        *  `projects`: `any[]`
    *  Each project in `res.projects` should have a:
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
2.  Pass with invalid project id --> receive `400`
3.  Pass with invalid reading id --> receive `400`
4.  Pass with non-existant project id --> receive `404`
5.  Pass with non-existant reading id --> receive `404`
6.  Pass without `Authorization` header --> receive `401`