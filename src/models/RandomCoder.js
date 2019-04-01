var randomstring = require('randomstring')
var SessionCode = require('./SessionCode')

var saveThatCode = function(code) {
  return new Promise(function(resolve, reject) {
    code.save(function(err, result) {
      if (err) {
        return resolve()
      } else {
        return resolve()
      }
    })
  })
}

var iterations = 0
var openThreads = 0
var randomCode

var runThatCoder = function() {
  while (iterations < 200000 && openThreads < 200) {
    openThreads++

    randomCode = randomstring.generate({
      length: 4,
      charset: '23456789bcdfghjkmnpqrstvwxyz',
      capitalization: 'lowercase',
      readable: true,
    })

    saveThatCode(SessionCode({ code: randomCode })).then(function() {
      iterations++
      openThreads--
      runThatCoder()
    })
  }
}

runThatCoder()
