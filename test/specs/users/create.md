# Edji Test Specs: Register User

## Goal

Ability to create a user by passing a user object to the server.
If the call is made with a temp_id, then the server will attempt to convert a temp user's readings/projects to the ownership of the new user.

## Request Type

`POST`

## Request Data

The request body will contain the following in json form

```javascript
req: {
  user: {
    username: string,
    password: string,
    fullname: string,
    email: string [enum],
    identities: string[]
  },
  temp_id: string
}
```

## Response Data

Coming soon?

## Test Cases

Note: Validation of this call without certain properties should be overlapped by tests for POST /users/login

### Standard Registration

1.  Pass good object
    *  `res` should have a:
        *  `user`: `any`
        *  `token`: `string`
2.  Pass invalid email, profane username and profane fullname
    *  `res` should have a:
        *  `status` = `406`
        *  `errors`: `any` should have a:
            *  `validationErrors`: `any` should have a:
                *  `fullname`: `string` = `badWords`
                *  `username`: `string` = `badWords`
                *  `email`: `string` = `emailRegex`
3.  Pass duplicate username
    *  `res` should have a:
        *  `status` = `409`
        *  `errors`: `any` should have a `username`
4.  Pass without email --> receive `400`

### Temp User Conversion Registration

Note: all of the temp user tests will assume a "good" `user` object, and successful registration

1.  Pass with temp_id which has one reading and one project
    *  `res` should have a:
        *  `status` = `201`
        *  `user`: `any`
        *  `token`: `string`
        *  `project_ids`: `string[]` -> this is an array containing the ids of the successfully converted projects
        *  `readings_ids`: `string[]` -> this is an array containing the ids of the successfully converted readings
2.  Pass with temp_id which does not exist --> receive `404`
3.  Pass with temp_id which is invalid --> receive `400`
