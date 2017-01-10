var Q = require("q");

var User = require("./../models/User");

// var globalUser = {
//     username:"nennerB",
//     fullname:"nennerB nilkciH",
//     password:"nennerbPass",
//     email:"nennerb.nilkcih@gmail.com",
//     isTeacher: false
// };

var users = {
  newUser: {
    username:"nennerB",
    fullname:"nennerB nilkciH",
    password:"nennerbPass",
    email:"nennerb.nilkcih@gmail.com",
    isTeacher: false
  },
  existingUser: {
    username: "Ydoc",
    fullname: "Ydoc Repmup",
    password: "whatsup",
    email:"cody@cody.cod",
    isTeacher: true
  },
  existingUserCredentials: {
    user: {
      username: "Ydoc",
      password: "whatsup"
    }
  }
}

var db = {
  seedDB: (done) => {
    var promises = [
      User.remove({}),
      User(users.existingUser).save((err) => {
        if (err) {
            console.error("Unable to save seed user for testing");
            console.error(err);
        }
      })
    ]
    
      
    Q.all(promises).done(() => {
      done();
    });
  },
  users: users
}



module.exports = db;
