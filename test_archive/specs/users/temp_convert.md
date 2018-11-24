# Edji Test Specs: Convert temp user's items to a user's ownership

## Goal

We want to convert all of a temp user's comments, badges, preferences, etc... to belong to the logged in user

## Request Type

`PUT`

## Request Data

You can actually give this call an empty object. It has all the info it needs from the currently logged in user and the url.

## Response Data

Coming soon?

## Test Cases

1.  Pass with temp_id which has one reading and one project
    *  `res` should have a:
        *  `status` = `201`
        *  `user`: `any`
        *  `token`: `string`
        *  `project_ids`: `string[]` -> this is an array containing the ids of the successfully converted projects
        *  `readings_ids`: `string[]` -> this is an array containing the ids of the successfully converted readings
2.  Pass with temp_id which does not exist --> receive `404`
3.  Pass with temp_id which is invalid --> receive `400`
4.  Pass with with bad auth token --> receive `401`