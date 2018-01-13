# Edji Test Specs: Search Readings

## Goal

Provide a generalized search for the Readings collection with specific query options

## Request Type

`GET`

## Credentials

This endpoint uses credentials to determine access to readings and which readings to return.

## Query Parameters

List of available query parameters and their acceptable values

### type

`string` with possible values:

- following (default) - uses the logged in user's following list to find readings published by those authors

Future values:

- popular - a list of the most copied or liked readings
- owned - a list of the readings published by the current user
- private - a list of the user's published readings which are private

### size

`number` with the size of array to return. Max 100. Default 15.

### start

`number` of results to start at. You'll be returned the results from Start to Start + Size. Can be used for pagination. Range is [0, 1000].

### grade

`number` or `number[]` corresponding to which grade levels to return. Can be either one value or an array of two values, which indicate a range. Acceptable range [0,13].

### subjects

`string[]` indicating which subject to search in. Should eventually be made an array of subjects to search.

Test cases still need to be written

### pop

`string` or `string[]` indicating which fields to sub-populate on the returned readings

Accepted values: `words`, `owner`

## Test Cases

1.  `GET` call to `/readings/feed` with authorized user
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings` should be an `array`
    *  `res.readings.length` should be `>= 2` (this is because at least two readings are required by later tests)
    *  `res.readings.length` should be `<= 15`
    *  `res.readings[0]` should have a:
        *  `_id`: `string`
        *  `owner_id`: `string` should be equal to the reading creator's id
        *  `title`: `string`
        *  `promoter_ids`: `string[]`
        *  `teacher_ids`: `string[]`
        *  `public`: `boolean` = `true`
        *  `updatedAt`: `Date`
        *  `createdAt`: `Date`
    *  `res.readings[0]` should NOT have:
        *  `words`: `any[]`
        *  `html`: `string`
        *  `comments`: `Comment[]`
2.  `GET` call to `/readings/feed?type=public`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings[0]._id` should be equal to `res.readings[0]._id` from test case 1
3.  `GET` call to `/readings/feed?size=1`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings.length` should be equal to 1
4.  `GET` call to `/readings/feed?size=500`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `size`
        *  `message`: `string` (should say something like "the requested size out of bounds")
5.  `GET` call to `/readings/feed?size=-1`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `size`
        *  `message`: `string` (should say something like "the requested size out of bounds")
6.  `GET` call to `/readings/feed?start=1`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings[0]._id` should be equal to `res.readings[1]._id` from test case 1
7.  `GET` call to `/readings/feed?start=-1`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `start`
        *  `message`: `string` (should say something like "the requested start was out of bounds")
8.  `GET` call to `/readings/feed?start=1100`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `start`
        *  `message`: `string` (should say something like "the requested start was out of bounds")
9.  `GET` call to `/readings/feed?grade=1`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  Each reading in `readings` array should have a `grade_levels` array which contains the value 1
10.  `GET` call to `/readings/feed?grade[]=1&grade[]=5`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  Each reading in `readings` array should have a `grade_levels` array which contains a value in the range [1,5]
11.  `GET` call to `/readings/feed?grade=-1`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `grade`
        *  `message`: `string` (should say something like "the requested grade was out of bounds")
12.  `GET` call to `/readings/feed?grade=20`
    *  `res` should have a `status` = `400`
    *  `res` should have `errors`
    *  `res.errors.length` should be `> 0`
    *  `res.errors[0]` should have:
        *  `property`: `string` = `grade`
        *  `message`: `string` (should say something like "the requested grade was out of bounds")
13.  `GET` call to `/readings/feed?type=following`
    *  `res` should have `status` = `200`
    *  `res` should have `readings`
    *  `res.readings.length` should be `> 0`
    *  Each item in the `res.readings` array should have:
        *  `owner_id` which is equal to one of the values in the user's `following` array