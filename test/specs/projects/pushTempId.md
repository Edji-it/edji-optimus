# Edji Test Specs: Add temp id to a project

## Goal

Users can update a project to contain a temp id

## Endpoint

`/projects/:id/push_temp`

## Request Type

`PUT`

## Request Data

The request body can be an empty object

## Response Data

```javascript
{
  project: Project
}
```

## Test Cases

1.  Pass good project as a temp user
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
2.  Pass with corrupt project id --> receive `400`
3.  Pass with non-existant project id --> receive `404`
4.  Pass without `Authorization` header --> receive `401`