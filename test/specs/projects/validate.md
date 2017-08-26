# Edji Test Specs: Validate Project

## Goal

Get all of a user's projects

## Endpoint

`/projects/:project_code/validate`

## Request Type

`GET`

## Response Body

```
_id: string
```

## Test Cases

1.  Pass with valid project code - all lower case
    *  `res` should have
        *  `status` = `200`
        *  `_id`: `string`
2.  Pass with valid project code but incorrect letter cases --> receive `200`
3.  Pass with invalid project code --> receive `404`