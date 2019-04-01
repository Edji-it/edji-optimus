# Edji Test Specs: Create Project

## Goal

Users can store a project

## Endpoint

`/projects`

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  project: {
    reading_id: string,
    label: string,
    types: string[] // can contain "emoji" and/or "text"
  }
}
```

## Response Data

Coming soon?

## Test Cases

1.  Pass good project
    - `res` should have a:
      - `status` = `201`
      - `project`: `any`
    - `res.project` should have a:
      - `_id`: `string`
      - `teacher_id`: `string`
      - `reading_id`: `string`
      - `label`: `string`
      - `code`: `string`
      - `types`: `string[]`
      - `temp_ids`: `string[]`
      - `students_ids`: `string[]`
      - `comments`: `Comment[]`
      - `updatedAt`: `Date`
      - `createdAt`: `Date`
2.  Pass without `project` --> receive `400`
3.  Pass without required fields
    - `res` should have a:
      - `status` = `406`
      - `errors`: `any` should have a:
        - `validationErrors`: `any` should have a:
          - `teacher_id`: `string` = `required`
          - `reading_id`: `string` = `required`
          - `label`: `string` = `required`
          - `code`: `string` = `required`
4.  Pass without `Authorization` header --> receive `401`
