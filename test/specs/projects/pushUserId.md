# Edji Test Specs: Add student or temp id to project

## Goal

Users can update a project to contain a new user or temp id

## Endpoint

`/projects/:id/user_id`

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

1.  Pass good project as a user
    *  `res` should have a:
        *  `status` = `200`
2.  Pass good project as a temp user
    *  `res` should have a:
        *  `status` = `200`
2.  Pass with corrupt project id --> receive `400`
3.  Pass with non-existant project id --> receive `404`
4.  Pass without `Authorization` header --> receive `401`