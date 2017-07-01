# Edji Test Specs: Request Permission to Delete Asset

## Goal

Provide a call which will check whether or not a user has permission to delete an asset. It checks for the asset to be stored on the user object and then returns a 200 if that user is allowed to delete the asset from s3.

## Request Type

`DELETE`

## Route

Needs Authorization token

`/users/assets/:type/:asset_id`

The type is the type of object you're looking to delete. Allowed values are:

`audio`

## Test Cases

1.  Pass with valid type and object id that exists on the user
    *  `res` should have a:
        *  `status` = `200`
        *  `file_locations`: `string[]` with a length greater than 0
2.  Pass with valid type and object id which does not exist on the user object
    *  `res` should have a:
        *  `status` = `404`
3.  Pass with invalid type => receive `400`
4.  Pass with invalid id => receive `400`
5.  Pass with invalid authorization toke => receive `401`