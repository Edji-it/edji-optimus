/**
 * Temporary User Model
 */
const ModelCreator = require('./ModelCreator').default

//the same code exists in the User object
const nameRe = /(?:([^a-zA-Z0-9\s]))/g
const listOfWordsItCantContainAtAll = [
  'fuck',
  'cunt',
  'nigger',
  'bitch',
  'bastard',
  'bugger',
  'bloody',
  'penis',
  'vagina',
  'blowjob',
  'pussy',
  'titties',
  'titty',
  'asshole',
  'nipple',
  'damn',
  'dammit',
  'twot',
  'faggot',
  'kike',
  'hymie',
  'canabis',
  'cocaine',
  'heroin',
  'marajuana',
  'opium',
  'xanax',
]
const validateName = function(name) {
  // needs to return true for good names
  return !listOfWordsItCantContainAtAll.find(word => {
    return name.indexOf(word) > -1
  })
}

const TempUserModel = ModelCreator(
  'TempUser',
  {
    fullname: { type: String, required: true, validate: [validateName, 'Invalid username'] },
    type: { type: String, required: true, default: 'temp' },
    prefs: {
      recentEmoji: [String],
      onboarding: {
        highlighting: {
          firstDone: Date,
          lastDone: Date,
        },
      },
    },
    last_action_time: Date, // the time the user last hit the server with an Authorization token
  },
  function(schema) {
    schema.methods.toPublic = function() {
      return this._doc
    }
  },
)

export default TempUserModel
