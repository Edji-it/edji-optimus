module.exports = {
  SERVER: require('..'),
  LOGIN_TOKENS: {
    API_TEACHER:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU5YmQ5Mzk1NTIzOWYzMDAxMTA1ZGJiMCIsImlhdCI6MTUyMDE5NDA3Mn0.e4t227lzqTXU3kYEQmfeyqKxUi9xQaWGgv1hVGyM04k',
    API_HERO:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjVhYjViMjg1MTcxNDcyMDAyM2YxMjM2MiIsImlhdCI6MTUyMTg1NzE1N30.PEdowRFeeAnUw0e9cyP2eXkRV8-OWp2a3DSAUAfYAaM',
    API_HERO2:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU5YmRhMDRhODVjNmFiMzQ2YzEyZGJiYyIsImlhdCI6MTUyMTg1NTY5Mn0.Z1fGPXBWEe3NE3iVi4p_wHItD3x5xJF_k_gWRqkG4-U',
    API_STUDENT:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU5YmQ5NDViNTIzOWYzMDAxMTA1ZGJiNiIsImlhdCI6MTUyMDE5NDEzMH0.mhRHwckpURGXhau8o913YBi4ikrYxgc6OyxzGpbr4Ag',
    TEMP_USER:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjVhOWM1MjZkNDFlOGE3MDAxNDA2NjFkZCIsInR5cGUiOiJ0ZW1wIiwiaWF0IjoxNTIwMTk0MTU3fQ.5Jds9a_4uyL1ye3yLBYzEHwN0UC0mrQUPa0DRfYTjXE',
    API_EMAIL_SUCCESS:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjViOWQ3YzBjNTJmODU5MDkwYzlhNWY5OCIsImlhdCI6MTUzNzA0NzU2NH0.JBt3nXqIa0Gwg6o0L3-tzLaIOmCKjZhCSZJNRz5jz0I',
  },
  LOGIN_INFO: {
    API_STUDENT: {
      username: 'apistudent',
      password: 'apistudent',
    },
    API_TEACHER: {
      username: 'apiteacher',
      password: 'apiteacher',
    },
    API_HERO: {
      username: 'apitesthero',
      password: 'apitesthero',
      email: 'apitesthero@edji.it',
    },
    API_HERO2: {
      username: 'apitesthero2',
      password: 'apitesthero2',
    },
    ACADEMY_HERO: {
      username: 'academy+api_hero@edji.it',
      password: 'academyhero',
    },
    ACADEMY_ADMIN: {
      username: 'academy+api_admin@edji.it',
      password: 'academyadmin',
    },
    API_EMAIL_SUCCESS: {
      username: 'api_email_success',
      password: 'tester',
      _id: '5b9d7c0c52f859090c9a5f98',
    },
    GOOGLE_OAUTH_USER: {
      email: 'edji.oauth.test@gmail.com',
    },
  },
  PROJECT_REF: {
    TEST_PROJECT: {
      project_id: '5b79c7562ea6d825a0002c28',
      code: 'readingrecap',
    },
    BAD_PROJECT: {
      project_id: '59bd9bda8e0867dcf65ed46',
      code: 'notarealcodeidjrugnrie',
    },
  },
  READINGS: {
    NEW_READING: {
      title: 'Test Create Reading',
      source: 'https://dev.edji.it',
      html:
        '<div>&nbsp;</div><img src="//image-dev.edji.it/pdf/b9bdbd6d-01f6-4e34-b12b-dce48e158e38/b9bdbd6d-01f6-4e34-b12b-dce48e158e38-0.jpg" title="undefined"><br><p></p><img src="//image-dev.edji.it/pdf/b9bdbd6d-01f6-4e34-b12b-dce48e158e38/b9bdbd6d-01f6-4e34-b12b-dce48e158e38-1.jpg" title="undefined"><br><p></p>',
      words: [
        null,
        {
          styles: ['br'],
          str: '',
        },
        {
          styles: ['img'],
          url:
            '//image-dev.edji.it/pdf/b9bdbd6d-01f6-4e34-b12b-dce48e158e38/b9bdbd6d-01f6-4e34-b12b-dce48e158e38-0.jpg',
          str: '',
        },
        {
          styles: ['br'],
          str: '',
        },
        {
          styles: ['br'],
          str: '',
        },
        {
          styles: ['br'],
          str: '',
        },
        {
          styles: ['img'],
          url:
            '//image-dev.edji.it/pdf/b9bdbd6d-01f6-4e34-b12b-dce48e158e38/b9bdbd6d-01f6-4e34-b12b-dce48e158e38-1.jpg',
          str: '',
        },
        {
          styles: ['br'],
          str: '',
        },
        {
          styles: ['br'],
          str: '',
        },
      ],
    },
  },
}
